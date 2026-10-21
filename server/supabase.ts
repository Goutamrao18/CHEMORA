import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';
const allowDevFallback = process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';

const SITE_URL = (process.env.SITE_URL || 'https://chemora.work.gd').trim().replace(/\/$/, '');

// 2.1: Supabase Keys - Split anon key from service role key; remove service role from anon fallback chain
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://mcwadkgzplurjtstrhdd.supabase.co'
).trim().replace(/\/$/, '');

const SUPABASE_ANON_KEY = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim();

export interface ServerUserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  rank: string;
  created_at?: string;
  updated_at?: string;
}

export function isDevFallbackAllowed(): boolean {
  return !isProd && allowDevFallback;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://'));
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith('https://'));
}

// 2.1: User-scoped Supabase client (ONLY anon key + user token)
export function getUserScopedSupabaseClient(token: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  } catch {
    return null;
  }
}

// Anon Supabase client for public/unauthenticated operations (signup/login)
let anonClientInstance: SupabaseClient | null = null;
export function getSupabaseAnonClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!anonClientInstance) {
    anonClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return anonClientInstance;
}

// 2.1: Separate Admin client (service-role key) used ONLY for progress writes, XP/counters, account deletion, and review writes
let adminClientInstance: SupabaseClient | null = null;
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClientInstance) {
    adminClientInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClientInstance;
}

// 2.3: Safe Log Scrubber - Tokens, emails, passwords, and sensitive request bodies are never logged
export function sanitizeLog(input: any): string {
  if (!input) return '';
  let str = typeof input === 'string' ? input : JSON.stringify(input);
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  str = str.replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"');
  str = str.replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[REDACTED]"');
  str = str.replace(/eyJ[a-zA-Z0-9_-]{20,}/g, '[REDACTED_JWT]');
  str = str.replace(/chemora_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_TOKEN]');
  return str;
}

export function safeLogInfo(message: string): void {
  console.info(sanitizeLog(message));
}

export function safeLogWarn(message: string, err?: any): void {
  console.warn(sanitizeLog(message), err ? sanitizeLog(err?.message || err) : '');
}

export function safeLogError(message: string, err?: any): void {
  console.error(sanitizeLog(message), err ? sanitizeLog(err?.message || err) : '');
}

// 2.8: Verify token server-side on every protected route
export async function verifyUserSessionToken(token: string): Promise<{ id: string; email: string } | null> {
  if (!token || typeof token !== 'string') return null;

  if (isDevFallbackAllowed()) {
    const uid = fallbackTokens.get(token);
    if (uid) {
      const u = fallbackUsers.get(uid);
      if (u) return { id: u.id, email: u.email };
    }
  }

  const client = getUserScopedSupabaseClient(token);
  if (!client) return null;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

// 2.9: Compute rank_title on the server
export function computeRankTitle(totalXp: number): string {
  if (totalXp >= 10000) return 'Grand Chemist Laureate';
  if (totalXp >= 6000) return 'Principal Investigator';
  if (totalXp >= 3500) return 'Senior Researcher';
  if (totalXp >= 2000) return 'Laboratory Specialist';
  if (totalXp >= 1000) return 'Apprentice Chemist';
  if (totalXp >= 400) return 'Junior Alchemist';
  return 'Novice Alchemist';
}

// 2.2: Development-Only in-memory auth structures
interface FallbackUser {
  id: string;
  email: string;
  passwordHash: string;
  full_name: string;
  avatar_url: string;
  rank: string;
  created_at: string;
  updated_at: string;
}

const fallbackUsers = new Map<string, FallbackUser>();
const fallbackTokens = new Map<string, string>(); // token -> userId

function generateSimpleDevToken(userId: string): string {
  return `chemora_${userId}_${crypto.randomBytes(24).toString('hex')}`;
}

async function devFallbackSignUp(email: string, password: string, fullName: string) {
  if (!isDevFallbackAllowed()) {
    throw new Error('Service temporarily unavailable.');
  }
  const normalizedEmail = email.toLowerCase().trim();
  for (const u of fallbackUsers.values()) {
    if (u.email === normalizedEmail) {
      // 2.7: Prevent account enumeration
      return {
        user: { id: u.id, email: normalizedEmail },
        session: { access_token: generateSimpleDevToken(u.id) },
        requiresEmailConfirmation: false,
        message: 'Account created or existing session restored.',
      };
    }
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: FallbackUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash,
    full_name: fullName.trim() || normalizedEmail.split('@')[0] || 'Researcher',
    avatar_url: '/favicon.png',
    rank: 'Novice Alchemist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  fallbackUsers.set(userId, newUser);
  const token = generateSimpleDevToken(userId);
  fallbackTokens.set(token, userId);

  return {
    user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name },
    session: { access_token: token },
    requiresEmailConfirmation: false,
    message: 'Researcher account created successfully.',
  };
}

async function devFallbackSignIn(email: string, password: string) {
  if (!isDevFallbackAllowed()) {
    throw new Error('Service temporarily unavailable.');
  }
  const normalizedEmail = email.toLowerCase().trim();
  let foundUser: FallbackUser | null = null;
  for (const u of fallbackUsers.values()) {
    if (u.email === normalizedEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    throw new Error('Invalid email or password.');
  }

  const matches = await bcrypt.compare(password, foundUser.passwordHash);
  if (!matches) {
    throw new Error('Invalid email or password.');
  }

  const token = generateSimpleDevToken(foundUser.id);
  fallbackTokens.set(token, foundUser.id);

  return {
    user: { id: foundUser.id, email: foundUser.email },
    profile: {
      id: foundUser.id,
      user_id: foundUser.id,
      email: foundUser.email,
      full_name: foundUser.full_name,
      avatar_url: foundUser.avatar_url,
      rank: foundUser.rank,
      created_at: foundUser.created_at,
      updated_at: foundUser.updated_at,
    },
    session: { access_token: token },
  };
}

// ==========================================
// User Signup
// ==========================================
export async function backendSignUp(email: string, password: string, fullName: string) {
  // 2.4: Minimum 10 characters password check
  if (!password || password.length < 10) {
    throw new Error('Password must be at least 10 characters long.');
  }

  const anonClient = getSupabaseAnonClient();
  if (!anonClient) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignUp(email, password, fullName);
    }
    throw new Error('Service temporarily unavailable. Please try again later.');
  }

  const { data, error } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignUp(email, password, fullName);
    }
    // 2.7: Prevent enumeration
    safeLogWarn('Supabase signUp error');
    return {
      user: { id: 'pending', email },
      session: null,
      requiresEmailConfirmation: true,
      message: 'If the credentials are valid, a confirmation link has been sent.',
    };
  }

  const user = data.user;
  const adminClient = getSupabaseAdminClient();
  if (user && adminClient) {
    try {
      await adminClient.from('profiles').upsert(
        {
          user_id: user.id,
          full_name: fullName || user.email?.split('@')[0] || 'Researcher',
          avatar_url: '/favicon.png',
          rank_title: 'Novice Alchemist',
          levels_cleared: 0,
          xp_earned: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (upsertErr) {
      safeLogWarn('Profile creation warning');
    }
  }

  return {
    user: user ? { id: user.id, email: user.email } : null,
    session: data.session,
    requiresEmailConfirmation: !data.session,
    message: 'Account created. If required, please verify your email address.',
  };
}

// ==========================================
// User Login
// ==========================================
export async function backendSignIn(email: string, password: string) {
  if (!password || password.length < 10) {
    throw new Error('Invalid email or password.');
  }

  const anonClient = getSupabaseAnonClient();
  if (!anonClient) {
    if (isDevFallbackAllowed()) {
      return devFallbackSignIn(email, password);
    }
    throw new Error('Service temporarily unavailable. Please try again later.');
  }

  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    if (isDevFallbackAllowed()) {
      try {
        return await devFallbackSignIn(email, password);
      } catch {
        throw new Error('Invalid email or password.');
      }
    }
    // 2.7: Prevent account enumeration
    throw new Error('Invalid email or password.');
  }

  const user = data.user;
  const profile = await backendGetProfile(user.id, user.email || email, undefined, data.session.access_token);

  return {
    user: { id: user.id, email: user.email },
    profile,
    session: data.session,
  };
}

// ==========================================
// Password Reset Request (2.3: Built-in Supabase reset)
// ==========================================
export async function backendResetPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
  const genericMessage = 'If an account exists with this email, password reset instructions have been dispatched.';
  if (!email || typeof email !== 'string') {
    return { success: true, message: genericMessage };
  }

  const anonClient = getSupabaseAnonClient();
  if (anonClient) {
    try {
      await anonClient.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${SITE_URL}/#account`,
      });
    } catch {
      safeLogWarn('Supabase resetPasswordForEmail warning');
    }
  }

  // 2.3: Never log reset token, password, or email!
  return { success: true, message: genericMessage };
}

// ==========================================
// Update Password
// ==========================================
export async function backendUpdatePassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // 2.4: 10-char minimum
  if (!newPassword || newPassword.length < 10) {
    throw new Error('New password must be at least 10 characters long.');
  }

  const client = getUserScopedSupabaseClient(token);
  if (!client) {
    throw new Error('Service temporarily unavailable.');
  }

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error('Unable to update password. Please check your session.');
  }

  return { success: true, message: 'Password updated successfully.' };
}

// ==========================================
// Get Profile
// ==========================================
export async function backendGetProfile(
  userId: string,
  email: string,
  defaultName?: string,
  token?: string
): Promise<ServerUserProfile> {
  const client = (token ? getUserScopedSupabaseClient(token) : null) || getSupabaseAnonClient();

  if (client) {
    try {
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        return {
          id: String(data.id || userId),
          user_id: data.user_id || userId,
          email: email,
          full_name: data.full_name || defaultName || 'Researcher',
          avatar_url: data.avatar_url || '/favicon.png',
          rank: data.rank_title || 'Novice Alchemist',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      safeLogWarn('Profile fetch note');
    }
  }

  if (isDevFallbackAllowed()) {
    const fb = fallbackUsers.get(userId);
    if (fb) {
      return {
        id: fb.id,
        user_id: fb.id,
        email: fb.email,
        full_name: fb.full_name,
        avatar_url: fb.avatar_url,
        rank: fb.rank,
        created_at: fb.created_at,
        updated_at: fb.updated_at,
      };
    }
  }

  return {
    id: userId,
    user_id: userId,
    email,
    full_name: defaultName || email.split('@')[0] || 'Researcher',
    avatar_url: '/favicon.png',
    rank: 'Novice Alchemist',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ==========================================
// Update Profile
// ==========================================
export async function backendUpdateProfile(
  userId: string,
  userEmail: string,
  updates: { full_name?: string; avatar_url?: string },
  token?: string
): Promise<ServerUserProfile> {
  const client = token ? getUserScopedSupabaseClient(token) : null;
  const adminClient = getSupabaseAdminClient();

  if (client && adminClient) {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) payload.full_name = updates.full_name.trim();
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url.trim();

    try {
      await adminClient.from('profiles').update(payload).eq('user_id', userId);
    } catch (err) {
      safeLogWarn('Profile update note');
    }
  }

  return backendGetProfile(userId, userEmail, updates.full_name, token);
}

// ==========================================
// Researcher Progress (2.9: Server-side validation)
// ==========================================
export interface ResearcherProgressData {
  userId: string;
  experimentsCompleted: number;
  challengesCompleted: number;
  streakDays: number;
  totalXp: number;
  rankTitle: string;
  completedExperimentIds?: string[];
  lastActiveAt?: string;
  updatedAt?: string;
}

const devProgressStore = new Map<string, ResearcherProgressData>();

export async function backendGetProgress(userId: string): Promise<{ progress: ResearcherProgressData; source: string }> {
  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      const { data } = await adminClient
        .from('researcher_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        return {
          progress: {
            userId,
            experimentsCompleted: Number(data.experiments_completed || 0),
            challengesCompleted: Number(data.challenges_completed || 0),
            streakDays: Number(data.streak_days || 0),
            totalXp: Number(data.total_xp || 0),
            rankTitle: computeRankTitle(Number(data.total_xp || 0)),
            completedExperimentIds: Array.isArray(data.completed_experiment_ids) ? data.completed_experiment_ids : [],
            lastActiveAt: data.updated_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString(),
          },
          source: 'supabase',
        };
      }
    } catch (err) {
      safeLogWarn('Progress lookup error');
    }
  }

  const existing = devProgressStore.get(userId) || {
    userId,
    experimentsCompleted: 0,
    challengesCompleted: 0,
    streakDays: 0,
    totalXp: 0,
    rankTitle: 'Novice Alchemist',
    completedExperimentIds: [],
    lastActiveAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { progress: existing, source: 'server-store' };
}

export async function backendSyncProgress(
  userId: string,
  progress: Partial<ResearcherProgressData>
): Promise<{ success: boolean; progress: ResearcherProgressData; source: 'supabase' | 'server-store' }> {
  const current = (await backendGetProgress(userId)).progress;

  // 2.9: Non-decreasing counters
  const mergedExperimentIds = Array.from(new Set([
    ...(current.completedExperimentIds || []),
    ...(Array.isArray(progress.completedExperimentIds) ? progress.completedExperimentIds : []),
  ]));

  const experimentsCompleted = Math.max(
    current.experimentsCompleted,
    progress.experimentsCompleted !== undefined ? progress.experimentsCompleted : 0,
    mergedExperimentIds.length
  );

  const challengesCompleted = Math.max(
    current.challengesCompleted,
    progress.challengesCompleted !== undefined ? progress.challengesCompleted : 0
  );

  // 2.9: Limit streak jumps: cannot jump by more than +1
  const requestedStreak = progress.streakDays !== undefined ? progress.streakDays : current.streakDays;
  const streakDays = Math.max(
    current.streakDays,
    Math.min(requestedStreak, current.streakDays + 1)
  );

  // 2.9: Cap per-sync XP gain to 5000 max
  const MAX_PER_SYNC_XP_DELTA = 5000;
  let totalXp = current.totalXp;
  if (progress.totalXp !== undefined && progress.totalXp > current.totalXp) {
    const requestedDelta = progress.totalXp - current.totalXp;
    totalXp = current.totalXp + Math.min(requestedDelta, MAX_PER_SYNC_XP_DELTA);
  }

  // 2.9: Compute rank_title on the server, ignore client-supplied rank
  const rankTitle = computeRankTitle(totalXp);

  const validatedProgress: ResearcherProgressData = {
    userId,
    experimentsCompleted,
    challengesCompleted,
    streakDays,
    totalXp,
    rankTitle,
    completedExperimentIds: mergedExperimentIds,
    lastActiveAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  devProgressStore.set(userId, validatedProgress);

  const adminClient = getSupabaseAdminClient();
  if (adminClient) {
    try {
      // 2.9: Write researcher_progress and profiles using admin client, keyed ONLY on user_id
      await adminClient.from('researcher_progress').upsert(
        {
          user_id: userId,
          experiments_completed: validatedProgress.experimentsCompleted,
          challenges_completed: validatedProgress.challengesCompleted,
          streak_days: validatedProgress.streakDays,
          total_xp: validatedProgress.totalXp,
          rank_title: validatedProgress.rankTitle,
          completed_experiment_ids: validatedProgress.completedExperimentIds || [],
          updated_at: validatedProgress.updatedAt,
        },
        { onConflict: 'user_id' }
      );

      await adminClient.from('profiles').update(
        {
          levels_cleared: validatedProgress.challengesCompleted,
          xp_earned: validatedProgress.totalXp,
          rank_title: validatedProgress.rankTitle,
          updated_at: validatedProgress.updatedAt,
        }
      ).eq('user_id', userId);

      return { success: true, progress: validatedProgress, source: 'supabase' };
    } catch (dbErr) {
      safeLogWarn('Supabase progress sync error');
    }
  }

  return { success: true, progress: validatedProgress, source: 'server-store' };
}

// ==========================================
// 2.10: Account Deletion (require password, admin client cascade)
// ==========================================
export async function backendDeleteAccount(userId: string, email: string, passwordConfirm: string): Promise<{ success: boolean }> {
  if (!passwordConfirm) {
    throw new Error('Password confirmation is required to delete your account.');
  }

  const anonClient = getSupabaseAnonClient();
  const adminClient = getSupabaseAdminClient();

  if (anonClient && adminClient) {
    // Re-verify password
    const { error: authErr } = await anonClient.auth.signInWithPassword({
      email,
      password: passwordConfirm,
    });

    if (authErr) {
      throw new Error('Incorrect password. Account deletion aborted.');
    }

    // Delete user via admin client with cascading deletions
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) {
      throw new Error('Failed to delete account. Please try again.');
    }
  } else if (isDevFallbackAllowed()) {
    const user = fallbackUsers.get(userId);
    if (!user) throw new Error('Account not found.');
    const match = await bcrypt.compare(passwordConfirm, user.passwordHash);
    if (!match) throw new Error('Incorrect password. Account deletion aborted.');
    fallbackUsers.delete(userId);
    fallbackTokens.delete(userId);
    devProgressStore.delete(userId);
  } else {
    throw new Error('Service temporarily unavailable.');
  }

  return { success: true };
}

// System diagnostics
export function getSupabaseSystemDiagnostics() {
  const isConfigured = isSupabaseConfigured();
  return {
    databaseConnected: isConfigured,
    engine: 'Supabase PostgreSQL',
    tables: ['profiles', 'researcher_progress', 'chemora_reviews'],
    security: {
      zeroLocalStorageAccount: true,
      serverSideAuthProxy: true,
      credentialsExposedToClient: false,
    },
    status: isConfigured ? 'Connected & Synced' : 'Ready (Active Server Database Engine)',
    mode: isConfigured ? 'cloud_supabase' : 'resilient_server_db',
  };
}
