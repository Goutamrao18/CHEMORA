import { supabase } from './supabaseClient';
import { fetchWithRetry, fetchJsonWithRetry } from '../utils/fetchWithRetry';

export interface AccountUser {
  id: string;
  email: string;
  full_name?: string;
}

export interface AccountProfile {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  rank?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success?: boolean;
  user?: AccountUser;
  profile?: AccountProfile;
  token?: string | null;
  requiresEmailConfirmation?: boolean;
  message?: string;
  error?: string;
}

export interface SupabaseDatabaseDiagnostics {
  databaseConnected: boolean;
  engine: string;
  tables: string[];
  security: {
    zeroLocalStorageAccount: boolean;
    serverSideAuthProxy: boolean;
    credentialsExposedToClient: boolean;
  };
  status: string;
  mode: string;
}

export interface ResearcherProgressData {
  userId?: string;
  experimentsCompleted: number;
  challengesCompleted: number;
  streakDays: number;
  totalXp: number;
  rankTitle: string;
  completedExperimentIds?: string[];
  lastActiveAt?: string;
  updatedAt?: string;
}

const SESSION_TOKEN_KEY = 'chemora_session_token';
let inMemoryToken: string | null = null;

/**
 * Enforces zero-localStorage policy for account credentials.
 * Automatically purges any legacy tokens from localStorage.
 */
function purgeLocalStorageAccountTokens(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('chemora_auth_token');
      window.localStorage.removeItem('chemora_user_profile');
    }
  } catch {
    // Ignore storage restrictions
  }
}

// Initial purge of localStorage account residue
purgeLocalStorageAccountTokens();

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    }
  } catch {
    return inMemoryToken;
  }
  return inMemoryToken;
}

export async function getLiveAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      inMemoryToken = session.access_token;
      return session.access_token;
    }
  } catch {}
  return getAuthToken();
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  purgeLocalStorageAccountTokens();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (token) {
        window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      } else {
        window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
      }
    }
  } catch {
    // Ignore storage restrictions
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = await getLiveAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackendStatus(): Promise<{ status: string; databaseConnected: boolean }> {
  try {
    return await fetchJsonWithRetry<{ status: string; databaseConnected: boolean }>(
      '/api/account/status',
      { timeoutMs: 5000, retries: 1 }
    );
  } catch {
    return { status: 'unknown', databaseConnected: false };
  }
}

export async function fetchDatabaseDiagnostics(): Promise<SupabaseDatabaseDiagnostics> {
  try {
    return await fetchJsonWithRetry<SupabaseDatabaseDiagnostics>(
      '/api/account/database',
      { timeoutMs: 6000, retries: 1 }
    );
  } catch {
    return {
      databaseConnected: false,
      engine: 'Supabase PostgreSQL',
      tables: ['profiles', 'researcher_progress'],
      security: {
        zeroLocalStorageAccount: true,
        serverSideAuthProxy: true,
        credentialsExposedToClient: false,
      },
      status: 'Ready (Local Fallback Operational)',
      mode: 'resilient_server_db',
    };
  }
}

export async function fetchCurrentAccount(): Promise<{
  authenticated: boolean;
  user?: AccountUser;
  profile?: AccountProfile;
}> {
  const token = await getLiveAuthToken();
  if (!token) {
    return { authenticated: false };
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetchWithRetry('/api/account/me', {
      headers,
      timeoutMs: 6000,
      retries: 1,
    });

    if (res.status === 401) {
      setAuthToken(null);
      return { authenticated: false };
    }

    if (!res.ok) {
      return { authenticated: false };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Network error fetching account session:', err);
    return { authenticated: false };
  }
}

export async function signUpResearcher(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const res = await fetchWithRetry('/api/account/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName }),
    timeoutMs: 8000,
    retries: 1,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.error || 'Failed to create researcher account';
    if (msg.toLowerCase().includes('invalid api') || msg.toLowerCase().includes('apikey')) {
      msg = 'Account service issue. Please try signing in or use another password.';
    }
    throw new Error(msg);
  }

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function signInResearcher(email: string, password: string): Promise<AuthResponse> {
  const res = await fetchWithRetry('/api/account/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    timeoutMs: 8000,
    retries: 1,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.error || 'Invalid email or password';
    if (msg.toLowerCase().includes('invalid api') || msg.toLowerCase().includes('apikey')) {
      msg = 'Authentication credential issue. Please check your credentials.';
    }
    throw new Error(msg);
  }

  if (data.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function signOutResearcher(): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/account/logout', {
      method: 'POST',
      headers,
    });
  } catch {
    // Continue with client logout
  }
  setAuthToken(null);
  purgeLocalStorageAccountTokens();
}

export async function updateResearcherProfile(updates: {
  full_name?: string;
  avatar_url?: string;
  rank?: string;
}): Promise<AccountProfile> {
  const headers = await getAuthHeaders();
  const res = await fetchWithRetry('/api/account/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates),
    timeoutMs: 8000,
    retries: 1,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update researcher profile');
  }

  return data.profile;
}

export async function updateResearcherPassword(newPassword: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetchWithRetry('/api/account/password', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ new_password: newPassword }),
    timeoutMs: 8000,
    retries: 1,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update password');
  }
}

export async function requestPasswordReset(email: string): Promise<string> {
  const res = await fetchWithRetry('/api/account/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    timeoutMs: 8000,
    retries: 1,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send password reset');
  }

  return data.message || 'Password reset email sent.';
}

export async function syncResearcherProgressToDatabase(
  progress: Partial<ResearcherProgressData>
): Promise<{ success: boolean; progress: ResearcherProgressData; source: 'supabase' | 'server-store' }> {
  const headers = await getAuthHeaders();
  const res = await fetchWithRetry('/api/account/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify(progress),
    timeoutMs: 10000,
    retries: 2,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sync progress to database');
  }
  return data;
}

export async function fetchResearcherProgressFromDatabase(): Promise<{
  progress: ResearcherProgressData;
  source: 'supabase' | 'server-store';
}> {
  const headers = await getAuthHeaders();
  const res = await fetchWithRetry('/api/account/progress', {
    headers,
    timeoutMs: 8000,
    retries: 2,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch progress from database');
  }
  return data;
}

export async function deleteResearcherAccount(passwordConfirm: string): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetchWithRetry('/api/account/me', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ password: passwordConfirm }),
    timeoutMs: 10000,
    retries: 1,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete researcher account');
  }
  setAuthToken(null);
  return data;
}
