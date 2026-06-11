import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AsyncLocalStorage } from 'async_hooks';

dotenv.config();

// Request context store for dynamic JWT scoping
export const authLocalStorage = new AsyncLocalStorage<string>();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Key is missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.');
}

// Internal admin client to bypass RLS for administrative updates
const _supabaseAdminInternal = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export let isSupabaseOffline = false;

// Simple connectivity check
async function checkConnectivity() {
  if (!supabaseUrl || !supabaseServiceKey) {
    isSupabaseOffline = true;
    return;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: supabaseServiceKey },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok && res.status !== 404 && res.status !== 401) {
      isSupabaseOffline = true;
    }
  } catch (err) {
    isSupabaseOffline = true;
    console.warn(`[SUPABASE CONNECTIVITY] Supabase is offline or unreachable (${supabaseUrl}). Running in simulated offline sandbox mode.`);
  }
}
checkConnectivity();

// Helper to get client dynamically
export function getDynamicSupabaseClient(): SupabaseClient {
  const token = authLocalStorage.getStore();
  if (token && supabaseUrl) {
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey;
    return createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return _supabaseAdminInternal;
}

// Export supabaseAdmin as a Proxy that dynamically routes to getDynamicSupabaseClient()
export const supabaseAdmin = new Proxy(_supabaseAdminInternal, {
  get(target, prop, receiver) {
    const dynamicClient = getDynamicSupabaseClient();
    const value = Reflect.get(dynamicClient, prop, dynamicClient);
    if (typeof value === 'function') {
      return value.bind(dynamicClient);
    }
    return value;
  }
});

// Export a raw, un-proxied client for explicit administrative actions
export const supabaseServiceRole = _supabaseAdminInternal;

import { Request } from 'express';

export function getSupabaseClient(req?: Request) {
  const authHeader = req?.headers?.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token && supabaseUrl) {
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey;
    return createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return _supabaseAdminInternal;
}
