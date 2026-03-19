import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });
config(); // fallback to .env

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

const SUPABASE_FETCH_TIMEOUT_MS = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? 10000);

function timeoutFetch(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// Admin client — bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: timeoutFetch },
});

// Create a client scoped to a specific user's JWT
export function createSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
      fetch: timeoutFetch,
    },
  });
}
