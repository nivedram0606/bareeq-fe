import { createClient } from '@supabase/supabase-js';

import { env } from './env';

/**
 * Supabase is used for authentication only (sign-in, password reset, session refresh).
 * All data goes through the Bareeq API; RLS blocks direct table access with this key.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
