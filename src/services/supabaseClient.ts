import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://mcwadkgzplurjtstrhdd.supabase.co'
).trim().replace(/\/$/, '');

export const SUPABASE_ANON_KEY: string = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable__35lrwlwhFj4SkhofWXJVw__Jca6f5P'
).trim();

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
