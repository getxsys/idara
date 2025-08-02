
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Supabase env vars missing:\nNEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (only export on server)
let supabaseAdmin: ReturnType<typeof createClient> | undefined = undefined;
if (typeof window === 'undefined') {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for supabaseAdmin on the server');
  }
  supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
export { supabaseAdmin };