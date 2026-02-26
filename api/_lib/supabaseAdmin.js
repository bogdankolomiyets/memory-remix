import { createClient } from '@supabase/supabase-js';

let supabaseAdminSingleton;

function getRequiredEnv(name, fallbackValue = null) {
  const value = process.env[name] || fallbackValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAdmin() {
  if (supabaseAdminSingleton) {
    return supabaseAdminSingleton;
  }

  const supabaseUrl = getRequiredEnv('SUPABASE_URL', process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  supabaseAdminSingleton = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdminSingleton;
}
