import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseKey = supabasePublishableKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  // Keep the thrown error clear; without these the app cannot auth/query.
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
