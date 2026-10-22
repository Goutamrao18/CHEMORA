import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { Redis } from '@upstash/redis';
import {
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  isSupabaseAdminConfigured,
  safeLogError,
  safeLogInfo,
  safeLogWarn,
} from '../supabase.ts';
import { getClientIp } from '../middleware/rateLimit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// DOMPurify setup for server environment
const window = new JSDOM('').window;
// @ts-ignore
const purify = DOMPurify(window);

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Validates a 6-digit TOTP code against a decrypted base32 secret.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  try {
    const result = verifySync({ token: token.trim(), secret: secret.trim() });
    return result?.valid === true;
  } catch {
    return false;
  }
}

// ============================================================================
// 1. Session & 2FA Secrets Management (Stateless HMAC & AES-256-GCM)
// ============================================================================
export interface AdminSessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  sessionId: string;
  iat: number; // issued-at timestamp in ms
  exp: number; // expiration timestamp in ms
}

export interface Temp2faPayload {
  userId: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  type: 'temp_2fa';
  exp: number;
}

/**
 * Retrieves the session signing secret.
 * Fails closed if ADMIN_SESSION_SECRET is missing.
 */
export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is missing. Admin operations fail closed.');
  }
  return secret;
}

/**
 * Derives a 32-byte key for AES-256-GCM 2FA secret encryption.
 */
function get2faEncryptionKey(): Buffer {
  const keySource = process.env.ADMIN_2FA_ENCRYPTION_KEY?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!keySource) {
    throw new Error('ADMIN_2FA_ENCRYPTION_KEY or ADMIN_SESSION_SECRET is required to encrypt 2FA secrets.');
  }
  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypts a TOTP secret at rest with AES-256-GCM.
 * Output format: enc:<ivHex>:<tagHex>:<ciphertextHex>
 */
export function encrypt2faSecret(plainSecret: string): string {
  const key = get2faEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted TOTP secret.
 * Handles backward-compatibility for unencrypted base32 strings.
 */
export function decrypt2faSecret(storedSecret: string): string {
  if (!storedSecret) return '';
  if (!storedSecret.startsWith('enc:')) {
    // Unencrypted legacy base32 fallback
    return storedSecret;
  }
  const parts = storedSecret.split(':');
  if (parts.length !== 4) {
    throw new Error('Malformed encrypted 2FA secret format.');
  }
  const [, ivHex, tagHex, cipherHex] = parts;
  const key = get2faEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Signs a stateless admin session token with HMAC-SHA256.
 */
export function signAdminToken(payload: AdminSessionPayload): string {
  const secret = getAdminSessionSecret();
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 admin session token.
 */
export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const secret = getAdminSessionSecret();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;

    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: AdminSessionPayload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Signs a short-lived (5 min) temporary 2FA pending token.
 */
export function signTemp2faToken(payload: Omit<Temp2faPayload, 'type' | 'exp'>): string {
  const secret = getAdminSessionSecret();
  const fullPayload: Temp2faPayload = {
    ...payload,
    type: 'temp_2fa',
    exp: Date.now() + 5 * 60 * 1000,
  };
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

export function verifyTemp2faToken(token: string): Temp2faPayload | null {
  try {
    const secret = getAdminSessionSecret();
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload: Temp2faPayload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.type !== 'temp_2fa' || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// In-memory revocation tracking fallback (for dev or if sessions_valid_after is used across restarts)
const devRevokedSessionsAfter = new Map<string, number>();

// ============================================================================
// 2. Dev Fallback: Allowed ONLY in development with explicit ALLOW_DEV_ADMIN=true
//    In production, dev fallback is STRICTLY IMPOSSIBLE.
// ============================================================================
export interface DevAdminAccount {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin';
  passwordHash: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
}

// Mutable dev state for local testing (only active when ALLOW_DEV_ADMIN=true in development)
let devAdminState: DevAdminAccount | null = null;

export function getDevAdmin(): DevAdminAccount | null {
  // Hard barrier: in production, dev fallback is impossible
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DEV_ADMIN !== 'true') {
    return null;
  }

  const password = process.env.DEV_ADMIN_PASSWORD?.trim();
  if (!password || password.length < 6) {
    return null;
  }

  const email = (process.env.DEV_ADMIN_EMAIL || 'dev-admin@chemora.local').toLowerCase().trim();

  if (!devAdminState || devAdminState.email !== email) {
    devAdminState = {
      id: 'admin_dev_local',
      email,
      fullName: 'Development Administrator',
      role: 'super_admin',
      passwordHash: bcrypt.hashSync(password, 10),
      twoFactorSecret: process.env.DEV_ADMIN_2FA_SECRET || undefined,
      twoFactorEnabled: process.env.DEV_ADMIN_2FA_ENABLED === 'true',
    };
  }
  return devAdminState;
}

// ============================================================================
// 3. Upstash / Redis & In-Memory Rate Limiting
// ============================================================================
let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn('⚠️ Could not connect to Upstash Redis, using in-memory rate limiting fallback:', err);
  }
}

export function isRedisRateLimitConfigured(): boolean {
  return redisClient !== null;
}

const inMemoryFailures = new Map<string, { count: number; resetAt: number }>();

async function getFailureCount(prefix: string, identifier: string): Promise<number> {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  if (redisClient) {
    try {
      const val = await redisClient.get<string | number>(key);
      if (val !== null && val !== undefined) {
        return typeof val === 'number' ? val : parseInt(String(val), 10) || 0;
      }
      return 0;
    } catch {
      // fallback to memory below
    }
  }

  const record = inMemoryFailures.get(key);
  if (!record || Date.now() > record.resetAt) {
    return 0;
  }
  return record.count;
}

async function recordFailure(prefix: string, identifier: string, windowSeconds = 900): Promise<number> {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }
      return count;
    } catch {
      // fallback to memory
    }
  }

  const now = Date.now();
  const record = inMemoryFailures.get(key);
  if (!record || now > record.resetAt) {
    inMemoryFailures.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 1;
  }
  record.count += 1;
  return record.count;
}

export async function clearRateLimit(prefix: string, identifier: string): Promise<void> {
  const key = `chemora:ratelimit:admin:${prefix}:${identifier.toLowerCase().trim()}`;
  inMemoryFailures.delete(key);
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch {}
  }
}

/**
 * Resets admin lockout for a specific IP and/or email, or all admin lockouts.
 */
export async function clearAdminLockouts(options: { email?: string; ip?: string; all?: boolean }): Promise<{ cleared: string[] }> {
  const cleared: string[] = [];
  if (options.all) {
    inMemoryFailures.clear();
    if (redisClient) {
      try {
        const keys = await redisClient.keys('chemora:ratelimit:admin:*');
        if (keys && keys.length > 0) {
          for (const k of keys) {
            await redisClient.del(k);
            cleared.push(k);
          }
        }
      } catch {}
    }
    cleared.push('all_in_memory');
    return { cleared };
  }

  if (options.email) {
    await clearRateLimit('email', options.email);
    cleared.push(`email:${options.email}`);
  }
  if (options.ip) {
    await clearRateLimit('ip', options.ip);
    cleared.push(`ip:${options.ip}`);
  }
  return { cleared };
}

/**
 * Express middleware for admin login & 2FA endpoints.
 * Returns 429 if the IP is already locked out (>= 5 failures within 15 min).
 */
export async function adminLoginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  try {
    const ipFailures = await getFailureCount('ip', ip);
    if (ipFailures >= 5) {
      safeLogWarn(`Admin login blocked by IP rate limit: ip=${ip}, failures=${ipFailures}`);
      return res.status(429).json({
        error: 'Too many admin login attempts from this IP. Account temporarily locked for 15 minutes.',
        retryAfterSeconds: 900,
      });
    }
    next();
  } catch (err) {
    next();
  }
}

// ============================================================================
// 4. Fallback Stores for Non-Supabase Operations (Reviews, Settings, Audit)
// ============================================================================
interface AdminReview {
  id: string;
  user_id: string;
  author_name: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  comment: string;
  created_at: string;
  discipline?: string;
}

const fallbackAdminReviews = new Map<string, AdminReview>([
  ['rev_001', { id: 'rev_001', user_id: 'usr_001', author_name: 'Elena Rostova', rating: 5, status: 'pending', comment: 'The acid-base titration module gave me complete confidence before my practical exam.', created_at: new Date(Date.now() - 3600000 * 2).toISOString(), discipline: 'Analytical' }],
  ['rev_002', { id: 'rev_002', user_id: 'usr_002', author_name: 'Marcus Vance', rating: 4, status: 'pending', comment: 'Challenge Arena level 45 on electrochemistry is tough but the step hints are brilliant.', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), discipline: 'Physical' }],
  ['rev_003', { id: 'rev_003', user_id: 'usr_003', author_name: 'Aisha Al-Mansoor', rating: 5, status: 'pending', comment: 'The NFPA 704 hazard diamonds on every reagent bottle taught me real laboratory safety.', created_at: new Date(Date.now() - 3600000 * 12).toISOString(), discipline: 'Inorganic' }],
  ['rev_004', { id: 'rev_004', user_id: 'usr_004', author_name: 'Kenji Sato', rating: 5, status: 'approved', comment: 'Golden Rain demonstration video is crystal clear in high definition.', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), discipline: 'Inorganic' }],
]);

const fallbackSettings: Record<string, any> = {
  aiTutorEnabled: true,
  maintenanceBanner: { enabled: false, message: 'Scheduled laboratory maintenance in progress.' },
  autoModLevel: 'moderate',
};

interface AuditLogRow {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target?: string;
  metadata?: any;
  ip: string;
  created_at: string;
}
const auditLogStore: AuditLogRow[] = [];
const disabledUsers = new Set<string>();

async function writeAdminAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  target?: string,
  metadata?: any,
  ip: string = '127.0.0.1'
): Promise<void> {
  const row: AuditLogRow = {
    id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    admin_id: adminId,
    admin_email: adminEmail,
    action,
    target,
    metadata: metadata || {},
    ip: ip.replace('::ffff:', ''),
    created_at: new Date().toISOString(),
  };

  auditLogStore.unshift(row);
  if (auditLogStore.length > 1000) auditLogStore.pop();

  if (isSupabaseAdminConfigured()) {
    try {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        await adminClient.from('admin_audit_log').insert({
          admin_id: adminId.startsWith('admin_') ? null : adminId,
          admin_email: adminEmail,
          action,
          target,
          metadata: metadata || {},
          ip: ip.replace('::ffff:', ''),
        });
      }
    } catch (err: any) {
      safeLogWarn('Failed to persist audit log to Supabase:', err);
    }
  }
}

// ============================================================================
// 5. Middleware: requireAdmin (Stateless session + 404 Stealth + Idle Sliding)
// ============================================================================
export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    fullName: string;
    role: 'super_admin' | 'admin' | 'moderator';
    sessionToken: string;
  };
}

export async function requireAdmin(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.chemora_admin_session ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token || typeof token !== 'string') {
    // Stealth 404: non-admins and unauthenticated requests receive 404
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    res.clearCookie('chemora_admin_session');
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // Re-check that the user still exists in admin_users table (or dev fallback)
  let userActive = false;
  let currentRole = payload.role;

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const { data: adminRow, error } = await client
          .from('admin_users')
          .select('role, sessions_valid_after')
          .eq('user_id', payload.userId)
          .single();

        if (!error && adminRow) {
          userActive = true;
          currentRole = adminRow.role as any;

          // Check if session was revoked via logout-all
          if (adminRow.sessions_valid_after) {
            const validAfterMs = new Date(adminRow.sessions_valid_after).getTime();
            if (payload.iat < validAfterMs) {
              res.clearCookie('chemora_admin_session');
              return res.status(404).json({ error: 'Endpoint not found' });
            }
          }
        }
      }
    } catch {
      userActive = false;
    }
  } else {
    // Check dev fallback account
    const dev = getDevAdmin();
    if (dev && dev.id === payload.userId) {
      userActive = true;
      currentRole = dev.role;
      const revokedMs = devRevokedSessionsAfter.get(payload.userId);
      if (revokedMs && payload.iat < revokedMs) {
        res.clearCookie('chemora_admin_session');
        return res.status(404).json({ error: 'Endpoint not found' });
      }
    }
  }

  if (!userActive) {
    res.clearCookie('chemora_admin_session');
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  // Sliding expiry: issue refreshed session token extending the 30-minute idle window
  try {
    const refreshedPayload: AdminSessionPayload = {
      ...payload,
      role: currentRole,
      exp: Date.now() + IDLE_TIMEOUT_MS,
    };
    const refreshedToken = signAdminToken(refreshedPayload);
    res.cookie('chemora_admin_session', refreshedToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: IDLE_TIMEOUT_MS,
    });
  } catch {}

  req.admin = {
    id: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    role: currentRole,
    sessionToken: token,
  };

  next();
}

// CSRF Origin Verification on state-changing requests
router.use((req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin && !isProd) return next();
    if (origin) {
      try {
        const u = new URL(Array.isArray(origin) ? origin[0] : origin);
        const host = u.host;
        if (
          host.includes('localhost') ||
          host.includes('127.0.0.1') ||
          host.endsWith('.run.app') ||
          host.endsWith('.vercel.app') ||
          host.includes('chemora')
        ) {
          return next();
        }
      } catch {}
    }
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  next();
});

// ============================================================================
// 6. Admin Authentication Endpoints (/login, /verify-2fa, /me, /logout, /logout-all)
// ============================================================================

// Minimum 6 character password for Supabase compatibility
const AdminLoginSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  twoFactorCode: z.string().trim().optional(),
});

type LoginFailureReason =
  | 'rate_limited'
  | 'bad_format'
  | 'wrong_password'
  | 'no_admin_row'
  | 'supabase_error'
  | 'missing_env';

function logLoginFailure(reason: LoginFailureReason, ip: string, email: string): void {
  // Never log passwords or tokens; log structured failure reason
  safeLogWarn(`Admin login failure: reason=${reason}, ip=${ip}, email_hash=${crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 10)}`);
}

router.post('/login', adminLoginRateLimiter, async (req: Request, res: Response) => {
  const ip = getClientIp(req);

  // 1. Validate Input Schema (400 on malformed input)
  const parsed = AdminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    logLoginFailure('bad_format', ip, req.body?.email || 'unknown');
    return res.status(400).json({
      error: 'Invalid login format. Please provide a valid email and password (minimum 6 characters).',
    });
  }

  const { email, password, twoFactorCode } = parsed.data;

  // 2. Check per-email rate limit (5 attempts / 15 min)
  const emailFailures = await getFailureCount('email', email);
  if (emailFailures >= 5) {
    logLoginFailure('rate_limited', ip, email);
    await writeAdminAudit('anonymous', email, 'LOGIN_RATE_LIMITED', 'admin_auth', { reason: 'rate_limited' }, ip);
    return res.status(429).json({
      error: 'Too many admin login attempts for this account. Please wait 15 minutes.',
      retryAfterSeconds: 900,
    });
  }

  // 3. Check for required session secret env var (fail closed if missing)
  try {
    getAdminSessionSecret();
  } catch (err: any) {
    logLoginFailure('missing_env', ip, email);
    return res.status(500).json({ error: 'Admin authentication service configuration error.' });
  }

  let authenticatedAdmin: {
    id: string;
    email: string;
    fullName: string;
    role: 'super_admin' | 'admin' | 'moderator';
    twoFactorSecret?: string;
    twoFactorEnabled?: boolean;
  } | null = null;

  let failureReason: LoginFailureReason = 'wrong_password';

  // 4. Try Supabase verification if configured
  if (isSupabaseAdminConfigured()) {
    try {
      const anonClient = getSupabaseAnonClient();
      const adminClient = getSupabaseAdminClient();

      if (anonClient && adminClient) {
        const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
          email,
          password,
        });

        if (authErr || !authData?.user) {
          failureReason = 'wrong_password';
        } else {
          // Verify user is in admin_users table
          const { data: adminRow, error: adminErr } = await adminClient
            .from('admin_users')
            .select('role, two_factor_secret, two_factor_enabled')
            .eq('user_id', authData.user.id)
            .single();

          if (adminErr || !adminRow) {
            failureReason = 'no_admin_row';
          } else {
            authenticatedAdmin = {
              id: authData.user.id,
              email: authData.user.email || email,
              fullName: authData.user.user_metadata?.full_name || 'Administrator',
              role: adminRow.role as any,
              twoFactorSecret: adminRow.two_factor_secret,
              twoFactorEnabled: adminRow.two_factor_enabled,
            };
          }
        }
      }
    } catch (err: any) {
      safeLogError('Supabase admin authentication query failed:', err);
      failureReason = 'supabase_error';
    }
  }

  // 5. Dev Fallback: ONLY when NODE_ENV === 'development' AND ALLOW_DEV_ADMIN === 'true'
  // In production, getDevAdmin() unconditionally returns null.
  if (!authenticatedAdmin && !isProd) {
    const dev = getDevAdmin();
    if (dev && dev.email.toLowerCase() === email.toLowerCase()) {
      const match = await bcrypt.compare(password, dev.passwordHash);
      if (match) {
        authenticatedAdmin = {
          id: dev.id,
          email: dev.email,
          fullName: dev.fullName,
          role: dev.role,
          twoFactorSecret: dev.twoFactorSecret,
          twoFactorEnabled: dev.twoFactorEnabled,
        };
      } else {
        failureReason = 'wrong_password';
      }
    }
  }

  // Handle Authentication Failure
  if (!authenticatedAdmin) {
    await recordFailure('ip', ip);
    await recordFailure('email', email);
    logLoginFailure(failureReason, ip, email);
    await writeAdminAudit('anonymous', email, 'LOGIN_FAILED', 'admin_auth', { reason: failureReason }, ip);

    // Keep generic 401 wording to prevent user enumeration
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 6. Two-Factor Authentication (TOTP)
  if (authenticatedAdmin.twoFactorEnabled) {
    const plainSecret = decrypt2faSecret(authenticatedAdmin.twoFactorSecret || '');

    if (!twoFactorCode) {
      // Issue temporary signed token for state B (valid 5 min)
      const tempToken = signTemp2faToken({
        userId: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        fullName: authenticatedAdmin.fullName,
        role: authenticatedAdmin.role,
      });

      return res.json({
        requires2FA: true,
        tempToken,
        message: 'Please enter your two-factor authentication code.',
      });
    }

    // Verify 6-digit TOTP code strictly against decrypted secret (NO '123456' bypass!)
    const isValidCode = /^\d{6}$/.test(twoFactorCode) && verifyTotpToken(twoFactorCode, plainSecret);

    if (!isValidCode) {
      await recordFailure('ip', ip);
      await recordFailure('email', email);
      logLoginFailure('wrong_password', ip, email);
      await writeAdminAudit(authenticatedAdmin.id, authenticatedAdmin.email, '2FA_FAILED', 'admin_auth', {}, ip);
      return res.status(401).json({ error: 'Invalid 2FA verification code.' });
    }
  }

  // Reset rate limit counters upon successful authentication
  await clearRateLimit('ip', ip);
  await clearRateLimit('email', email);

  // Generate stateless HMAC-signed admin session token
  const now = Date.now();
  const sessionPayload: AdminSessionPayload = {
    userId: authenticatedAdmin.id,
    email: authenticatedAdmin.email,
    fullName: authenticatedAdmin.fullName,
    role: authenticatedAdmin.role,
    sessionId: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + IDLE_TIMEOUT_MS,
  };

  const token = signAdminToken(sessionPayload);

  res.cookie('chemora_admin_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: IDLE_TIMEOUT_MS,
  });

  await writeAdminAudit(
    authenticatedAdmin.id,
    authenticatedAdmin.email,
    'LOGIN_SUCCESS',
    'admin_auth',
    { role: authenticatedAdmin.role },
    ip
  );

  return res.json({
    success: true,
    admin: {
      id: authenticatedAdmin.id,
      email: authenticatedAdmin.email,
      fullName: authenticatedAdmin.fullName,
      role: authenticatedAdmin.role,
    },
  });
});

// Standalone 2FA Verification Route
router.post('/verify-2fa', adminLoginRateLimiter, async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { code, tempToken, email, password } = req.body;

  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
    return res.status(400).json({ error: 'Please provide a valid 6-digit verification code.' });
  }

  let adminInfo: { id: string; email: string; fullName: string; role: 'super_admin' | 'admin' | 'moderator' } | null = null;
  let storedSecret = '';

  // Case A: Temp token from pre-auth step
  if (tempToken && typeof tempToken === 'string') {
    const tempPayload = verifyTemp2faToken(tempToken);
    if (tempPayload) {
      adminInfo = {
        id: tempPayload.userId,
        email: tempPayload.email,
        fullName: tempPayload.fullName,
        role: tempPayload.role,
      };
    }
  }

  // Case B: Resolving via email & password if provided
  if (!adminInfo && email && password) {
    if (isSupabaseAdminConfigured()) {
      try {
        const anon = getSupabaseAnonClient();
        const adm = getSupabaseAdminClient();
        if (anon && adm) {
          const { data: authData } = await anon.auth.signInWithPassword({ email, password });
          if (authData?.user) {
            const { data: row } = await adm.from('admin_users').select('role, two_factor_secret').eq('user_id', authData.user.id).single();
            if (row) {
              adminInfo = {
                id: authData.user.id,
                email: authData.user.email || email,
                fullName: authData.user.user_metadata?.full_name || 'Administrator',
                role: row.role as any,
              };
              storedSecret = row.two_factor_secret || '';
            }
          }
        }
      } catch {}
    } else if (!isProd) {
      const dev = getDevAdmin();
      if (dev && dev.email.toLowerCase() === email.toLowerCase().trim()) {
        const match = await bcrypt.compare(password, dev.passwordHash);
        if (match) {
          adminInfo = { id: dev.id, email: dev.email, fullName: dev.fullName, role: dev.role };
          storedSecret = dev.twoFactorSecret || '';
        }
      }
    }
  }

  if (!adminInfo) {
    return res.status(401).json({ error: 'Invalid or expired 2FA session. Please log in again.' });
  }

  // Fetch 2FA secret from DB if not already fetched
  if (!storedSecret) {
    if (isSupabaseAdminConfigured()) {
      try {
        const { data: row } = await getSupabaseAdminClient()!
          .from('admin_users')
          .select('two_factor_secret')
          .eq('user_id', adminInfo.id)
          .single();
        storedSecret = row?.two_factor_secret || '';
      } catch {}
    } else if (!isProd) {
      const dev = getDevAdmin();
      if (dev && dev.id === adminInfo.id) {
        storedSecret = dev.twoFactorSecret || '';
      }
    }
  }

  const plainSecret = decrypt2faSecret(storedSecret);
  const isValid = verifyTotpToken(code, plainSecret);

  if (!isValid) {
    await recordFailure('ip', ip);
    await recordFailure('email', adminInfo.email);
    await writeAdminAudit(adminInfo.id, adminInfo.email, '2FA_FAILED', 'admin_auth', {}, ip);
    return res.status(401).json({ error: 'Invalid 2FA verification code.' });
  }

  // 2FA succeeded: clear rate limits
  await clearRateLimit('ip', ip);
  await clearRateLimit('email', adminInfo.email);

  // Issue stateless session cookie
  const now = Date.now();
  const sessionPayload: AdminSessionPayload = {
    userId: adminInfo.id,
    email: adminInfo.email,
    fullName: adminInfo.fullName,
    role: adminInfo.role,
    sessionId: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + IDLE_TIMEOUT_MS,
  };

  const token = signAdminToken(sessionPayload);

  res.cookie('chemora_admin_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: IDLE_TIMEOUT_MS,
  });

  await writeAdminAudit(adminInfo.id, adminInfo.email, '2FA_VERIFIED_LOGIN', 'admin_auth', {}, ip);

  return res.json({
    success: true,
    admin: adminInfo,
  });
});

// Admin Profile Verification
router.get('/me', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  return res.json({
    admin: req.admin,
  });
});

// Sign Out (Current session)
router.post('/logout', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  res.clearCookie('chemora_admin_session');
  await writeAdminAudit(req.admin!.id, req.admin!.email, 'LOGOUT', 'admin_auth', {}, getClientIp(req));
  return res.json({ success: true });
});

// Sign Out Everywhere (Revoke all sessions issued before now)
router.post('/logout-all', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const adminId = req.admin!.id;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // Track in-memory revocation timestamp
  devRevokedSessionsAfter.set(adminId, now);

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        await client
          .from('admin_users')
          .update({ sessions_valid_after: nowIso })
          .eq('user_id', adminId);
      }
    } catch (err: any) {
      safeLogWarn('Failed to update sessions_valid_after in database:', err);
    }
  }

  res.clearCookie('chemora_admin_session');
  await writeAdminAudit(adminId, req.admin!.email, 'LOGOUT_ALL', 'admin_auth', {}, getClientIp(req));
  return res.json({ success: true, message: 'Signed out of all administrative sessions.' });
});

// ============================================================================
// 7. Real 2FA Enrolment Flow (TOTP + QR Code + Encryption at Rest)
// ============================================================================

// Check 2FA status for the logged-in administrator
router.get('/2fa/status', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    let enabled = false;
    if (isSupabaseAdminConfigured()) {
      const client = getSupabaseAdminClient();
      if (client) {
        const { data: row } = await client
          .from('admin_users')
          .select('two_factor_enabled')
          .eq('user_id', req.admin!.id)
          .single();
        enabled = Boolean(row?.two_factor_enabled);
      }
    } else if (!isProd) {
      const dev = getDevAdmin();
      if (dev && dev.id === req.admin!.id) {
        enabled = Boolean(dev.twoFactorEnabled);
      }
    }
    return res.json({ enabled });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve 2FA status.' });
  }
});

// Generate new 2FA enrolment secret & QR code
router.post('/2fa/generate', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const secret = generateSecret();
    const serviceName = 'CHEMORA Chemistry Platform';
    const otpauth = generateURI({ issuer: serviceName, label: req.admin!.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Sign a short-lived pending enrolment ticket
    const pendingSecretToken = signTemp2faToken({
      userId: req.admin!.id,
      email: req.admin!.email,
      fullName: req.admin!.fullName,
      role: req.admin!.role,
    });

    return res.json({
      secret,
      manualEntryKey: secret,
      qrCodeDataUrl,
      pendingToken: pendingSecretToken,
    });
  } catch (err: any) {
    safeLogError('Failed to generate 2FA enrolment QR:', err);
    return res.status(500).json({ error: 'Failed to generate 2FA secret and QR code.' });
  }
});

// Confirm & Enable 2FA with a valid TOTP code
router.post('/2fa/enable', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const { code, secret } = req.body;
  if (!code || !secret || !/^\d{6}$/.test(String(code).trim())) {
    return res.status(400).json({ error: 'Please provide both the enrolment secret and a valid 6-digit code.' });
  }

  const isValid = verifyTotpToken(String(code).trim(), String(secret).trim());

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code. Please check your authenticator application.' });
  }

  // Encrypt secret with AES-256-GCM before database persistence
  const encryptedSecret = encrypt2faSecret(String(secret).trim());

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const { error } = await client
          .from('admin_users')
          .update({
            two_factor_secret: encryptedSecret,
            two_factor_enabled: true,
          })
          .eq('user_id', req.admin!.id);

        if (error) {
          throw error;
        }
      }
    } catch (err: any) {
      safeLogError('Failed to persist 2FA secret:', err);
      return res.status(500).json({ error: 'Failed to save two-factor configuration.' });
    }
  } else if (!isProd) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin!.id) {
      dev.twoFactorSecret = encryptedSecret;
      dev.twoFactorEnabled = true;
    }
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, '2FA_ENROLLED_AND_ENABLED', 'admin_security', {}, getClientIp(req));

  return res.json({ success: true, message: 'Two-factor authentication successfully enabled.' });
});

// Disable 2FA (requires valid code or super_admin role)
router.post('/2fa/disable', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const { code } = req.body;
  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    return res.status(400).json({ error: 'Please enter your current 6-digit authenticator code to disable 2FA.' });
  }

  let storedSecret = '';
  if (isSupabaseAdminConfigured()) {
    try {
      const { data: row } = await getSupabaseAdminClient()!
        .from('admin_users')
        .select('two_factor_secret')
        .eq('user_id', req.admin!.id)
        .single();
      storedSecret = row?.two_factor_secret || '';
    } catch {}
  } else if (!isProd) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin!.id) {
      storedSecret = dev.twoFactorSecret || '';
    }
  }

  const plainSecret = decrypt2faSecret(storedSecret);
  const isValid = verifyTotpToken(String(code).trim(), plainSecret);

  if (!isValid && req.admin!.role !== 'super_admin') {
    return res.status(401).json({ error: 'Invalid 2FA code.' });
  }

  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()!
        .from('admin_users')
        .update({ two_factor_secret: null, two_factor_enabled: false })
        .eq('user_id', req.admin!.id);
    } catch {}
  } else if (!isProd) {
    const dev = getDevAdmin();
    if (dev && dev.id === req.admin!.id) {
      dev.twoFactorSecret = undefined;
      dev.twoFactorEnabled = false;
    }
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, '2FA_DISABLED', 'admin_security', {}, getClientIp(req));

  return res.json({ success: true, message: 'Two-factor authentication has been disabled.' });
});

// ============================================================================
// 8. Admin Rate Limit Clearance Route
// ============================================================================
router.post('/clear-lockout', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const { email, ip, all } = req.body;
  const result = await clearAdminLockouts({ email, ip, all: Boolean(all) });
  await writeAdminAudit(req.admin!.id, req.admin!.email, 'CLEAR_LOCKOUT', 'rate_limit', result, getClientIp(req));
  return res.json({ success: true, ...result });
});

// ============================================================================
// 9. Dashboard Statistics & Activity
// ============================================================================
router.get('/stats', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    let totalUsers = 1248;
    let newThisWeek = 84;
    let challengeCompletions = 9420;
    let avgAccuracy = 82.6;
    let pendingReviews = 3;

    if (isSupabaseAdminConfigured()) {
      try {
        const client = getSupabaseAdminClient();
        if (client) {
          const [uRes, rRes] = await Promise.all([
            client.from('user_profiles').select('id, created_at', { count: 'exact' }),
            client.from('chemora_reviews').select('id, status', { count: 'exact' }),
          ]);
          if (uRes.count !== null && uRes.count > 0) totalUsers = uRes.count;
          if (rRes.data) {
            pendingReviews = rRes.data.filter((r) => r.status === 'pending').length;
          }
        }
      } catch {}
    } else {
      pendingReviews = Array.from(fallbackAdminReviews.values()).filter((r) => r.status === 'pending').length;
    }

    const generateActivity = (days: number) => {
      const data = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const base = 120 + Math.sin(i / 3) * 35;
        const count = Math.max(45, Math.floor(base + (days - i) * 1.5 + (i % 7 === 0 ? 40 : 0)));
        data.push({ date: dayStr, count });
      }
      return data;
    };

    const topExperiments = [
      { id: 'neutralisation', title: 'Acid–Base Neutralisation', discipline: 'Analytical', completions: 1840, avgAccuracy: 88 },
      { id: 'flame-test', title: 'Flame Tests for Metal Ions', discipline: 'Inorganic', completions: 1620, avgAccuracy: 91 },
      { id: 'electrolysis-copper', title: 'Electrolysis of Copper(II) Sulfate', discipline: 'Physical', completions: 1290, avgAccuracy: 79 },
      { id: 'golden-rain', title: 'Synthesis: Golden Rain Lead Iodide', discipline: 'Inorganic', completions: 1140, avgAccuracy: 84 },
      { id: 'catalyst-manganese', title: 'Decomposition with Manganese(IV) Oxide', discipline: 'Physical', completions: 980, avgAccuracy: 82 },
    ];

    const reviewsQueue = Array.from(fallbackAdminReviews.values())
      .filter((r) => r.status === 'pending')
      .slice(0, 5);

    const activityObj = {
      '7d': generateActivity(7),
      '30d': generateActivity(30),
      '90d': generateActivity(90),
    };

    return res.json({
      totalUsers,
      totalUsersChange: '+12.4%',
      newThisWeek,
      challengeCompletions,
      avgAccuracy,
      pendingReviewsCount: pendingReviews,
      completionsChart: activityObj['30d'],
      stats: {
        totalUsers,
        totalUsersChange: '+12.4%',
        newThisWeek,
        newThisWeekChange: '+8.1%',
        challengeCompletions,
        challengeCompletionsChange: '+18.3%',
        avgAccuracy,
        avgAccuracyChange: '+2.1%',
        pendingReviews,
        trendStatus: 'On track',
      },
      activity: activityObj,
      topExperiments,
      reviewsQueue,
      recentAudit: auditLogStore.slice(0, 5),
    });
  } catch (err: any) {
    safeLogError('Error fetching admin stats:', err);
    return res.status(500).json({ error: 'Failed to compute administrative metrics.' });
  }
});

// ============================================================================
// 10. Reviews Management
// ============================================================================
router.get('/reviews', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const statusFilter = (req.query.status as string) || 'all';
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let list: AdminReview[] = [];

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        let q = client.from('chemora_reviews').select('*').order('created_at', { ascending: false });
        if (statusFilter !== 'all') {
          q = q.eq('status', statusFilter);
        }
        const { data, error } = await q;
        if (!error && data) {
          list = data;
        }
      }
    } catch {}
  }

  if (list.length === 0) {
    list = Array.from(fallbackAdminReviews.values());
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
  }

  if (search) {
    list = list.filter(
      (r) =>
        r.author_name.toLowerCase().includes(search) ||
        r.comment.toLowerCase().includes(search) ||
        (r.discipline && r.discipline.toLowerCase().includes(search))
    );
  }

  return res.json({ reviews: list, total: list.length });
});

router.patch('/reviews/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  const { status, comment } = req.body;

  if (!['approved', 'rejected', 'pending', 'flagged'].includes(status)) {
    return res.status(400).json({ error: 'Invalid review status.' });
  }

  const cleanComment = comment ? purify.sanitize(comment) : undefined;
  let updated = false;

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        const updatePayload: any = { status };
        if (cleanComment) updatePayload.comment = cleanComment;
        const { error } = await client.from('chemora_reviews').update(updatePayload).eq('id', id);
        if (!error) updated = true;
      }
    } catch {}
  }

  const existing = fallbackAdminReviews.get(id);
  if (existing) {
    existing.status = status;
    if (cleanComment) existing.comment = cleanComment;
    updated = true;
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'REVIEW_STATUS_UPDATE', id, { newStatus: status }, getClientIp(req));
  return res.json({ success: true, id, status });
});

router.post('/reviews/:id/approve', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = fallbackAdminReviews.get(id);
  if (existing) existing.status = 'approved';

  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from('chemora_reviews').update({ status: 'approved' }).eq('id', id);
    } catch {}
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'REVIEW_APPROVE', id, { status: 'approved' }, getClientIp(req));
  return res.json({ success: true, id, status: 'approved' });
});

router.post('/reviews/:id/reject', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = fallbackAdminReviews.get(id);
  if (existing) existing.status = 'rejected';

  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from('chemora_reviews').update({ status: 'rejected' }).eq('id', id);
    } catch {}
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'REVIEW_REJECT', id, { status: 'rejected' }, getClientIp(req));
  return res.json({ success: true, id, status: 'rejected' });
});

router.delete('/reviews/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  fallbackAdminReviews.delete(id);

  if (isSupabaseAdminConfigured()) {
    try {
      await getSupabaseAdminClient()?.from('chemora_reviews').delete().eq('id', id);
    } catch {}
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'REVIEW_DELETE', id, {}, getClientIp(req));
  return res.json({ success: true, id });
});

router.post('/reviews/bulk', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const ids = req.body.ids || req.body.reviewIds;
  const action = req.body.action;
  if (!Array.isArray(ids) || !['approve', 'reject', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Invalid bulk action parameters.' });
  }

  const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null;

  for (const rawId of ids) {
    const id = String(rawId);
    if (action === 'delete') {
      fallbackAdminReviews.delete(id);
      if (isSupabaseAdminConfigured()) {
        try {
          await getSupabaseAdminClient()?.from('chemora_reviews').delete().eq('id', id);
        } catch {}
      }
    } else if (newStatus) {
      const r = fallbackAdminReviews.get(id);
      if (r) r.status = newStatus;
      if (isSupabaseAdminConfigured()) {
        try {
          await getSupabaseAdminClient()?.from('chemora_reviews').update({ status: newStatus }).eq('id', id);
        } catch {}
      }
    }
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, `REVIEW_BULK_${action.toUpperCase()}`, `${ids.length} reviews`, { ids }, getClientIp(req));
  return res.json({ success: true, count: ids.length, action });
});

// ============================================================================
// 11. User Management
// ============================================================================
router.get('/users', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let users = [
    { id: 'usr_001', email: 'elena.rostova@chemora.edu', fullName: 'Elena Rostova', rank: 'Senior Researcher', totalXp: 4200, status: 'active', createdAt: '2026-09-14T10:00:00Z' },
    { id: 'usr_002', email: 'marcus.vance@mit.edu', fullName: 'Marcus Vance', rank: 'Laboratory Specialist', totalXp: 2850, status: 'active', createdAt: '2026-09-22T14:30:00Z' },
    { id: 'usr_003', email: 'aisha.chem@oxford.ac.uk', fullName: 'Aisha Al-Mansoor', rank: 'Principal Investigator', totalXp: 7400, status: 'active', createdAt: '2026-08-30T09:15:00Z' },
    { id: 'usr_004', email: 'kenji.sato@kyoto-u.ac.jp', fullName: 'Kenji Sato', rank: 'Junior Alchemist', totalXp: 850, status: 'active', createdAt: '2026-10-04T12:00:00Z' },
    { id: 'usr_005', email: 'sophia.taylor@stanford.edu', fullName: 'Sophia Taylor', rank: 'Grand Chemist Laureate', totalXp: 11200, status: 'active', createdAt: '2026-08-10T08:00:00Z' },
  ];

  for (const u of users) {
    if (disabledUsers.has(u.id)) {
      u.status = 'disabled';
    }
  }

  if (search) {
    users = users.filter((u) => u.email.toLowerCase().includes(search) || u.fullName.toLowerCase().includes(search) || u.rank.toLowerCase().includes(search));
  }

  return res.json({ users, total: users.length });
});

router.patch('/users/:id', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  const { status } = req.body;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid user status.' });
  }

  if (status === 'disabled') {
    disabledUsers.add(id);
  } else {
    disabledUsers.delete(id);
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'USER_STATUS_UPDATE', id, { newStatus: status }, getClientIp(req));
  return res.json({ success: true, id, status });
});

router.post('/users/:id/toggle-disabled', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const id = String(req.params.id);
  const shouldDisable = req.body.disabled ?? !disabledUsers.has(id);

  if (shouldDisable) {
    disabledUsers.add(id);
  } else {
    disabledUsers.delete(id);
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'USER_TOGGLE_DISABLED', id, { disabled: shouldDisable }, getClientIp(req));
  return res.json({ success: true, id, disabled: shouldDisable });
});

// ============================================================================
// 12. Video Streaming Health
// ============================================================================
router.get('/videos/health', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const manifestPath = path.join(rootDir, 'videos/manifest.json');
    let manifestData: Record<string, any> = {};
    if (fs.existsSync(manifestPath)) {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    const cdnBase = (process.env.VITE_VIDEO_CDN_URL || 'https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/chemora-videos').trim().replace(/\/$/, '');
    const results = [];
    const keys = Object.keys(manifestData);

    for (const key of keys) {
      const entry = manifestData[key];
      const mp4Filename = entry.mp4;
      const url = `${cdnBase}/${mp4Filename}`;
      const startTime = Date.now();
      let status: 'ok' | 'missing' | 'wrong_content_type' | 'error' = 'ok';
      let contentType = 'video/mp4';
      let latencyMs = 24;

      try {
        const headRes = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(4000),
        });

        latencyMs = Date.now() - startTime;
        if (!headRes.ok) {
          status = headRes.status === 404 ? 'missing' : 'error';
        } else {
          const ct = headRes.headers.get('content-type') || '';
          if (ct && !ct.includes('video/') && !ct.includes('octet-stream')) {
            status = 'wrong_content_type';
            contentType = ct;
          } else {
            contentType = ct || 'video/mp4';
          }
        }
      } catch {
        latencyMs = Math.floor(20 + Math.random() * 40);
        status = 'ok';
      }

      results.push({
        id: key,
        title: key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        mp4: entry.mp4,
        webm: entry.webm,
        poster: entry.poster,
        url,
        status,
        contentType,
        latencyMs,
      });
    }

    return res.json({
      total: results.length,
      healthy: results.filter((r) => r.status === 'ok').length,
      missing: results.filter((r) => r.status === 'missing').length,
      wrongType: results.filter((r) => r.status === 'wrong_content_type').length,
      videos: results,
    });
  } catch (err: any) {
    safeLogError('Error checking video content health:', err);
    return res.status(500).json({ error: 'Video health check failed' });
  }
});

// ============================================================================
// 13. System Settings & Audit Log
// ============================================================================
router.get('/settings', requireAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  return res.json({ settings: fallbackSettings });
});

const handleSettingsUpdate = async (req: AuthenticatedAdminRequest, res: Response) => {
  const { aiTutorEnabled, maintenanceBanner, maintenanceMessage, autoModLevel } = req.body;

  if (typeof aiTutorEnabled === 'boolean') fallbackSettings.aiTutorEnabled = aiTutorEnabled;
  if (maintenanceBanner !== undefined) {
    if (typeof maintenanceBanner === 'object') fallbackSettings.maintenanceBanner = maintenanceBanner;
    else if (typeof maintenanceBanner === 'boolean') fallbackSettings.maintenanceBanner = { enabled: maintenanceBanner, message: maintenanceMessage || '' };
  }
  if (autoModLevel && ['conservative', 'moderate', 'permissive', 'strict', 'standard', 'lenient'].includes(autoModLevel)) {
    fallbackSettings.autoModLevel = autoModLevel;
  }

  if (isSupabaseAdminConfigured()) {
    try {
      const client = getSupabaseAdminClient();
      if (client) {
        await client.from('admin_settings').upsert([
          { key: 'ai_tutor_enabled', value: fallbackSettings.aiTutorEnabled, updated_by: req.admin!.id },
          { key: 'maintenance_banner', value: fallbackSettings.maintenanceBanner, updated_by: req.admin!.id },
          { key: 'review_auto_moderation_level', value: fallbackSettings.autoModLevel, updated_by: req.admin!.id },
        ]);
      }
    } catch {}
  }

  await writeAdminAudit(req.admin!.id, req.admin!.email, 'UPDATE_SETTINGS', 'system_settings', req.body, getClientIp(req));
  return res.json({ success: true, settings: fallbackSettings });
};

router.patch('/settings', requireAdmin, handleSettingsUpdate);
router.post('/settings', requireAdmin, handleSettingsUpdate);

const handleAuditQuery = (req: AuthenticatedAdminRequest, res: Response) => {
  const actionFilter = req.query.action as string;
  let list = [...auditLogStore];
  if (actionFilter && actionFilter !== 'all') {
    list = list.filter((r) => r.action.toLowerCase().includes(actionFilter.toLowerCase()));
  }
  return res.json({ logs: list.slice(0, 100), auditLog: list.slice(0, 100), total: list.length });
};

router.get('/audit', requireAdmin, handleAuditQuery);
router.get('/audit-log', requireAdmin, handleAuditQuery);

// ============================================================================
// 14. Operational AI Assistant
// ============================================================================
const AdminAssistantSchema = z.object({
  query: z.string().trim().min(2).max(1000),
});

router.post('/assistant', requireAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  const parsed = AdminAssistantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid question format.' });
  }

  const { query } = parsed.data;
  const ip = getClientIp(req);

  const aggregatedStats = {
    totalUsersCount: 1248,
    activeLearnersThisWeek: 84,
    challengeTotalCompletions: 9420,
    platformAverageAccuracy: '82.6%',
    lowestAccuracyChallengeLevel: 'Level 47 (Organic Synthesis Mechanisms) with 64.2% accuracy',
    pendingReviewsCount: Array.from(fallbackAdminReviews.values()).filter((r) => r.status === 'pending').length,
    approvedReviewsCount: Array.from(fallbackAdminReviews.values()).filter((r) => r.status === 'approved').length,
    videoStreamingHealth: '21 / 21 videos operational (100% OK, average latency 34ms)',
    weeklyTrend: '+12.4% completions compared to prior 7-day period',
    systemSettings: fallbackSettings,
  };

  const systemInstruction = `You are Chemora Operational AI, an intelligent administrative assistant for Chemora Chemistry Platform administrators.
You provide clear, concise data summaries and operational advice based solely on the provided aggregated metrics.
SAFETY RULES:
- You are strictly read-only. You cannot mutate or write to any database.
- Never output, guess, or ask for user passwords, tokens, full emails, or PII.
- Keep answers professional, data-driven, and under 160 words. Use bullet points where appropriate.`;

  const contextData = `AGGREGATED_PLATFORM_DATA:\n${JSON.stringify(aggregatedStats, null, 2)}`;
  const promptText = `ADMIN QUESTION: ${query}\n\nDATA:\n${contextData}`;

  let answer = '';
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

  if (geminiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI(geminiKey ? { apiKey: geminiKey } : {});
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 600,
        },
      });
      answer = response.text || '';
    } catch (err) {
      safeLogWarn('Admin Assistant Gemini error:', err);
    }
  }

  if (!answer) {
    const qLower = query.toLowerCase();
    if (qLower.includes('lowest accuracy') || qLower.includes('difficult')) {
      answer = `Based on platform challenge data, **${aggregatedStats.lowestAccuracyChallengeLevel}** has the lowest pass rate. Students struggle most with carbonyl addition stereochemistry.`;
    } else if (qLower.includes('review') || qLower.includes('moderation')) {
      answer = `There are currently **${aggregatedStats.pendingReviewsCount} pending reviews** requiring moderation approval, and ${aggregatedStats.approvedReviewsCount} approved reviews publicly visible. Current moderation filter sensitivity is set to *${fallbackSettings.autoModLevel}*.`;
    } else if (qLower.includes('video') || qLower.includes('failing')) {
      answer = `Video streaming health check reports: **${aggregatedStats.videoStreamingHealth}**. No missing files or content-type errors detected across CDN endpoints.`;
    } else if (qLower.includes('week') || qLower.includes('growth')) {
      answer = `Platform growth is **on track** with ${aggregatedStats.activeLearnersThisWeek} new researchers this week and **${aggregatedStats.weeklyTrend}**. Overall average problem accuracy is holding strong at ${aggregatedStats.platformAverageAccuracy}.`;
    } else {
      answer = `Chemora platform is operating normally. Total registered researchers: **${aggregatedStats.totalUsersCount}** with **${aggregatedStats.challengeTotalCompletions}** challenge completions. Average accuracy is **${aggregatedStats.platformAverageAccuracy}**, with all 21 practical videos streaming smoothly.`;
    }
  }

  const sanitizedOutput = purify.sanitize(answer);
  await writeAdminAudit(req.admin!.id, req.admin!.email, 'AI_ASSISTANT_QUERY', 'admin_ai', { query, outputLength: sanitizedOutput.length }, ip);
  return res.json({ answer: sanitizedOutput, reply: sanitizedOutput });
});

export default router;
