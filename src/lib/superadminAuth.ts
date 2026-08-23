import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export interface SuperAdminAuthUser {
  id: string;
  role: string;
  email?: string;
  institution_id?: string;
  [key: string]: unknown;
}

export interface SuperAdminAuthResult {
  authorized: boolean;
  user?: SuperAdminAuthUser;
  response?: NextResponse;
}

export function verifySuperAdminAuth(req: NextRequest): SuperAdminAuthResult {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required. Authorization header missing.' },
        { status: 401 }
      ),
    };
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Server configuration error: JWT_SECRET missing.' },
        { status: 500 }
      ),
    };
  }

  // Handle mock tokens if explicitly allowed in dev
  if (token.startsWith('mock-sandbox')) {
    if (process.env.ALLOW_MOCK_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const decoded = JSON.parse(payloadJson) as SuperAdminAuthUser;
          if ((decoded.role || '').toLowerCase() === 'superadmin') {
            return { authorized: true, user: decoded };
          }
        }
      } catch {}
    }
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Mock sandbox tokens are disabled or unauthorized for SuperAdmin routes.' },
        { status: 403 }
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as SuperAdminAuthUser;
    const role = (decoded?.role || '').toLowerCase();
    if (role !== 'superadmin') {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: 'Access denied. SuperAdmin privileges required.' },
          { status: 403 }
        ),
      };
    }
    return { authorized: true, user: decoded };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired authentication token.' },
        { status: 401 }
      ),
    };
  }
}
