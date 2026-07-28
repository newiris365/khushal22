import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Force this route to always be server-rendered (never statically cached).
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

// Create a service-role supabase client to fetch profiles bypassed RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Standardized mapping of lowercased role strings to their official capitalized casings
const ROLE_CASING_MAP: Record<string, string> = {
  'admin': 'Admin',
  'superadmin': 'SuperAdmin',
  'staff': 'Staff',
  'teacher': 'Teacher',
  'student': 'Student',
  'parent': 'Parent',
  'warden': 'Warden',
  'security': 'Security',
  'vendor': 'Vendor',
  'driver': 'Driver',
  'director': 'Director',
  'tpo': 'TPO',
  'hod': 'HOD',
  'librarian': 'Librarian',
  'gym trainer': 'Gym Trainer',
  'iqac coordinator': 'IQAC Coordinator',
  'admissions officer': 'Admissions Officer',
  'principal': 'Principal',
  'vice principal': 'Vice Principal',
  'vp': 'Vice Principal',
  'hr admin': 'HR Admin',
  'applicant': 'Applicant',
  'company hr': 'Company HR',
  'alumni': 'Alumni'
};

function normalizeRole(role: string | undefined | null): string {
  if (!role) return '';
  const normalized = ROLE_CASING_MAP[role.toLowerCase()];
  return normalized || role;
}

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'SuperAdmin': return '/admin/global';
    case 'Admin': return '/admin/dashboard';
    case 'Student': return '/student/dashboard';
    case 'Warden': return '/warden/hostel';
    case 'Security': return '/gate';
    case 'Driver': return '/transit';
    case 'Librarian': return '/librarian/library';
    case 'Director': return '/director';
    case 'Parent': return '/parent/dashboard';
    case 'Teacher': return '/teacher/timetable';
    case 'HOD': return '/hod/dashboard';
    case 'Vendor': return '/vendor/dashboard';
    case 'Principal': return '/principal/dashboard';
    case 'Vice Principal': return '/vp/dashboard';
    case 'VP': return '/vp/dashboard';
    case 'HR Admin': return '/hr/my/dashboard';
    case 'Company HR': return '/company';
    case 'IQAC Coordinator': return '/iqac';
    case 'Admissions Officer': return '/officer';
    case 'TPO': return '/tpo';
    case 'Staff': return '/faculty';
    case 'Applicant': return '/applicant';
    default: return '/dashboard';
  }
};

function renderErrorPage(errorMessage: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Authentication Error</title></head>
    <body style="background-color:#0D0A1A;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;max-width:440px;width:100%;padding:32px;border:1px solid rgba(239,68,68,0.25);background-color:#13102A;border-radius:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        <div style="width:48px;height:48px;border-radius:50%;background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
          <svg style="width:24px;height:24px;color:#EF4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 style="color:#EF4444;font-size:20px;font-weight:800;margin-top:0;margin-bottom:8px;">Authentication Failed</h2>
        <p style="font-size:13px;color:#C4B5FD;line-height:1.6;margin-bottom:24px;">${errorMessage}</p>
        <a href="/login" style="display:block;width:100%;box-sizing:border-box;text-align:center;padding:12px;background:linear-gradient(to right,#6C2BD9,#8B5CF6);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;">Return to Login</a>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

/**
 * Client-side bridge page that handles BOTH:
 * 1. PKCE code exchange (reads code_verifier from browser cookies)
 * 2. Implicit flow hash fragments (reads access_token from URL hash)
 *
 * On Vercel serverless, the cookies() API from next/headers cannot reliably
 * read cookies set by document.cookie before the OAuth redirect. But the
 * browser CAN read its own cookies — so the PKCE exchange must happen
 * client-side.
 */
function renderClientBridge(supabaseUrlForClient: string, supabaseAnonKey: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Authenticating...</title></head>
    <body style="background-color:#0D0A1A;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div id="status" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;">
        <div style="width:40px;height:40px;border:3px solid rgba(124,58,237,0.3);border-top-color:#7C3AED;border-radius:50%;animation:spin 1s infinite linear;"></div>
        <p style="font-size:14px;font-weight:500;color:#C4B5FD;">Completing Google sign-in...</p>
      </div>
      <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
      <script>
        (async function(){
          try {
            var url = new URL(window.location.href);
            var code = url.searchParams.get('code');
            var deviceId = url.searchParams.get('device_id') || '';
            var hash = window.location.hash;

            // ─── Path 1: Hash fragment (implicit flow) ─────────────────────────
            if (!code && hash && hash.includes('access_token=')) {
              var params = new URLSearchParams(hash.substring(1));
              var at = params.get('access_token');
              var rt = params.get('refresh_token');
              if (at) {
                var u = new URL(window.location.href);
                u.hash = '';
                u.searchParams.delete('code');
                u.searchParams.set('access_token', at);
                if (rt) u.searchParams.set('refresh_token', rt);
                window.location.href = u.toString();
                return;
              }
            }

            // ─── Path 2: PKCE code exchange (client-side) ──────────────────────
            if (code) {
              // Read the PKCE code_verifier from browser cookies.
              // @supabase/ssr stores it as chunked base64url cookies.
              var allCookies = {};
              document.cookie.split(';').forEach(function(c) {
                var parts = c.trim().split('=');
                var name = parts[0];
                var val = parts.slice(1).join('=');
                allCookies[name] = decodeURIComponent(val);
              });

              // Try multiple possible cookie name patterns
              var possibleKeys = [
                'sb-auth-token-code-verifier',
                'sb-${supabaseUrlForClient.replace('https://', '').split('.')[0]}-auth-token-code-verifier'
              ];

              var codeVerifier = null;
              for (var ki = 0; ki < possibleKeys.length; ki++) {
                var storageKey = possibleKeys[ki];

                // Try single cookie
                if (allCookies[storageKey]) {
                  codeVerifier = decodeVerifier(allCookies[storageKey]);
                  if (codeVerifier) break;
                }

                // Try chunked cookies (.0, .1, .2, ...)
                var combined = '';
                for (var ci = 0; ci < 10; ci++) {
                  var chunkName = storageKey + '.' + ci;
                  if (allCookies[chunkName]) {
                    combined += allCookies[chunkName];
                  } else {
                    break;
                  }
                }
                if (combined) {
                  codeVerifier = decodeVerifier(combined);
                  if (codeVerifier) break;
                }
              }

              if (!codeVerifier) {
                // Last resort: scan all cookies for anything containing 'code-verifier'
                var keys = Object.keys(allCookies);
                for (var si = 0; si < keys.length; si++) {
                  if (keys[si].includes('code-verifier') || keys[si].includes('code_verifier')) {
                    codeVerifier = decodeVerifier(allCookies[keys[si]]);
                    if (codeVerifier) break;
                  }
                }
              }

              if (!codeVerifier) {
                showError('Could not find PKCE code verifier. Please clear cookies and try again.');
                return;
              }

              // Exchange code + code_verifier via Supabase token endpoint
              var tokenUrl = '${supabaseUrlForClient}'.replace(/\\/$/, '') + '/auth/v1/token?grant_type=pkce';
              var resp = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': '${supabaseAnonKey}'
                },
                body: JSON.stringify({
                  auth_code: code,
                  code_verifier: codeVerifier
                })
              });

              if (!resp.ok) {
                var errText = await resp.text();
                console.error('PKCE exchange failed:', errText);
                showError('Google sign-in verification failed. Please clear cookies and try again.');
                return;
              }

              var tokenData = await resp.json();

              if (tokenData.access_token) {
                // Success! Redirect to the server-side handler with tokens as query params
                var callbackUrl = new URL(window.location.origin + '/auth/callback');
                callbackUrl.searchParams.set('access_token', tokenData.access_token);
                if (tokenData.refresh_token) callbackUrl.searchParams.set('refresh_token', tokenData.refresh_token);
                if (deviceId) callbackUrl.searchParams.set('device_id', deviceId);
                window.location.href = callbackUrl.toString();
                return;
              }

              showError('Token exchange returned no access token.');
              return;
            }

            // No code and no hash tokens
            window.location.href = '/login?error=' + encodeURIComponent('No authorization data returned from Google.');

          } catch(e) {
            console.error('Auth bridge error:', e);
            showError('Authentication error: ' + (e.message || 'Unknown error'));
          }

          function decodeVerifier(val) {
            if (!val) return null;
            // Remove surrounding quotes
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            // Handle base64url encoded values (from @supabase/ssr)
            if (val.startsWith('base64-')) {
              var b64 = val.substring(7);
              var padded = b64.replace(/-/g, '+').replace(/_/g, '/');
              while (padded.length % 4 !== 0) padded += '=';
              try {
                var decoded = atob(padded);
                // The decoded value is JSON stringified by auth-js
                try { return JSON.parse(decoded); } catch(e2) { return decoded; }
              } catch(e) {
                return null;
              }
            }
            // Try JSON parse (raw format)
            try { return JSON.parse(val); } catch(e) { return val; }
          }

          function showError(msg) {
            document.getElementById('status').innerHTML =
              '<div style="width:48px;height:48px;border-radius:50%;background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">' +
              '<svg style="width:24px;height:24px;color:#EF4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' +
              '</div>' +
              '<p style="font-size:13px;color:#EF4444;font-weight:700;margin:0 0 8px 0;">Authentication Failed</p>' +
              '<p style="font-size:12px;color:#C4B5FD;margin:0 0 16px 0;">' + msg + '</p>' +
              '<a href="/login" style="display:inline-block;padding:10px 24px;background:linear-gradient(to right,#6C2BD9,#8B5CF6);color:white;text-decoration:none;border-radius:12px;font-weight:bold;font-size:13px;">Return to Login</a>';
          }
        })();
      </script>
    </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const accessToken = requestUrl.searchParams.get('access_token');
  const refreshToken = requestUrl.searchParams.get('refresh_token');

  // ─── Client-side bridge for PKCE code exchange or hash fragment parsing ────
  // If we have a `code` but no `access_token`, the PKCE exchange must happen
  // client-side because the browser holds the code_verifier cookie.
  // If we have neither, check for hash fragment tokens (implicit flow).
  if (!accessToken) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return renderClientBridge(supabaseUrl, anonKey);
  }

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    return renderErrorPage('JWT Secret key is missing or invalid on the server.');
  }

  try {
    // ─── Validate access token via admin client ──────────────────────────────
    // At this point, the client-side bridge has already exchanged the PKCE code
    // for tokens. We just need to validate the access_token and look up the user.
    console.log('[auth/callback] Validating access token via admin client...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData.user) {
      throw new Error(userError?.message || 'Failed to retrieve user from access token');
    }
    const authUser = userData.user;
    const authSession = {
      access_token: accessToken,
      refresh_token: refreshToken || ''
    };

    const email = authUser.email;
    if (!email) {
      throw new Error('No email returned from Google authentication provider');
    }

    // Fetch user profile matching the authenticated email (case-insensitive)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*, institutions(name, plan_tier, type)')
      .ilike('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('[auth/callback] Profile lookup error:', profileError.message);
    }

    let resolvedRole = 'Student';
    let resolvedInstitutionId = 'a0000000-0000-0000-0000-000000000001';
    let resolvedName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Google User';
    let resolvedInstitutionName = 'SIN Institute of Engineering & Technology (SIET)';
    let resolvedPlanTier = 'University';
    let resolvedInstituteType = 'college';
    let isActive = true;
    let profileId = authUser.id;

    if (userProfile) {
      resolvedRole = userProfile.role;
      resolvedInstitutionId = userProfile.institution_id;
      resolvedName = userProfile.name;
      resolvedInstitutionName = userProfile.institutions?.name || resolvedInstitutionName;
      resolvedPlanTier = userProfile.institutions?.plan_tier || resolvedPlanTier;
      resolvedInstituteType = userProfile.institutions?.type === 'school' ? 'school' : 'college';
      isActive = userProfile.is_active;
      profileId = userProfile.id;
    } else {
      // Email not found in users table — reject OAuth login
      return NextResponse.redirect(new URL('/login?error=user_not_found', requestUrl.origin));
    }

    if (!isActive) {
      return renderErrorPage('Your platform profile has been deactivated.');
    }

    const normalizedRole = normalizeRole(resolvedRole);

    const tokenClaims = {
      id: profileId,
      institution_id: resolvedInstitutionId,
      role: normalizedRole,
      email,
      supabase_token: authSession.access_token,
      supabase_refresh_token: authSession.refresh_token,
      institute_type: resolvedInstituteType
    };

    const token = jwt.sign(tokenClaims, JWT_SECRET, { expiresIn: '7d' });

    const profileData = {
      id: profileId,
      name: resolvedName,
      email,
      role: normalizedRole,
      institution_id: resolvedInstitutionId,
      institution_name: resolvedInstitutionName,
      plan_tier: resolvedPlanTier,
      institute_type: resolvedInstituteType
    };

    const redirectPath = getRedirectPath(normalizedRole);

    // ─── Reliable token delivery via URL redirect ─────────────────────────────
    const loginRedirectUrl = new URL('/login', requestUrl.origin);
    loginRedirectUrl.searchParams.set('token', token);
    loginRedirectUrl.searchParams.set('refresh', authSession.refresh_token);
    loginRedirectUrl.searchParams.set('profile', JSON.stringify(profileData));
    loginRedirectUrl.searchParams.set('path', redirectPath);

    return NextResponse.redirect(loginRedirectUrl);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OAuth authentication failed.';
    console.error('[auth/callback] Error:', message);
    return renderErrorPage(message);
  }
}
