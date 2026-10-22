import { createClient, SupabaseClient } from '@supabase/supabase-js';

function resolveValidUrl(candidate?: unknown): string {
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed && trimmed !== 'undefined' && trimmed !== 'null') {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return trimmed.replace(/\/$/, '');
        }
      } catch {
        // invalid URL format
      }
    }
  }
  return '';
}

function resolveValidKey(candidate?: unknown): string {
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed && trimmed.length > 20 && trimmed !== 'undefined' && trimmed !== 'null') {
      return trimmed;
    }
  }
  return '';
}

export const SUPABASE_URL: string = resolveValidUrl(import.meta.env?.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY: string = resolveValidKey(import.meta.env?.VITE_SUPABASE_ANON_KEY);

function createMockSupabaseClient(): SupabaseClient {
  const dummyAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => {
        try {
          callback('INITIAL_SESSION', null);
        } catch {}
      }, 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: new Error('Supabase client unavailable'),
    }),
    signInWithOAuth: async () => ({
      data: { provider: 'google', url: '' },
      error: new Error('Supabase client unavailable'),
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: new Error('Supabase client unavailable'),
    }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
  };

  const createDummyQuery = () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      ilike: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      insert: () => q,
      update: () => q,
      upsert: () => q,
      delete: () => q,
    };
    return q;
  };

  const dummyStorage = {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '/favicon.png' } }),
    }),
  };

  return {
    auth: dummyAuth,
    from: () => createDummyQuery(),
    storage: dummyStorage,
  } as unknown as SupabaseClient;
}

function initSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return createMockSupabaseClient();
  }
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Could not initialize Supabase client, using resilient fallback:', err);
    return createMockSupabaseClient();
  }
}

export const supabase: SupabaseClient = initSupabase();
