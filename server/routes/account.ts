import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  backendSignUp,
  backendSignIn,
  verifyUserSessionToken,
  backendGetProfile,
  backendUpdateProfile,
  backendUpdatePassword,
  backendResetPasswordRequest,
  backendSyncProgress,
  backendGetProgress,
  getSupabaseSystemDiagnostics,
  isSupabaseConfigured,
  backendDeleteAccount,
  getUserScopedSupabaseClient,
  safeLogError,
} from '../supabase.ts';

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

// 2.6: CSRF Origin Verification on all state-changing requests
const ALLOWED_ORIGINS = new Set([
  'https://chemora.work.gd',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.SITE_URL?.trim().replace(/\/$/, ''),
].filter(Boolean));

function isAllowedOrigin(originHeader?: string | string[]): boolean {
  if (!originHeader) return false;
  const originStr = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  try {
    const parsed = new URL(originStr);
    const origin = parsed.origin;
    if (ALLOWED_ORIGINS.has(origin)) return true;
    if (origin.endsWith('.vercel.app') || origin.endsWith('.run.app')) return true;
    return false;
  } catch {
    return false;
  }
}

router.use((req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    if (!origin && !isProd) {
      return next();
    }
    if (!origin || !isAllowedOrigin(origin)) {
      return res.status(403).json({ error: 'Invalid or untrusted request origin.' });
    }
  }
  next();
});

// 2.4: Strict validation schemas enforcing 10-character minimum passwords
export const SignUpSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(10, 'Password must be at least 10 characters').max(120),
  full_name: z.string().trim().max(80).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(10, 'Password must be at least 10 characters').max(120),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(80).optional(),
  avatar_url: z.string().trim().max(255).optional(),
});

export const PasswordUpdateSchema = z.object({
  new_password: z.string().min(10, 'New password must be at least 10 characters').max(120),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
});

export const ResetPasswordWithTokenSchema = z.object({
  token: z.string().trim().min(10, 'Invalid token').max(255),
  new_password: z.string().min(10, 'New password must be at least 10 characters').max(120),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required'),
});

export const SyncProgressSchema = z.object({
  experimentsCompleted: z.number().int().min(0).max(1000).optional(),
  challengesCompleted: z.number().int().min(0).max(1000).optional(),
  streakDays: z.number().int().min(0).max(10000).optional(),
  totalXp: z.number().int().min(0).max(10000000).optional(),
  completedExperimentIds: z.array(z.string().trim().max(60)).max(200).optional(),
});

function extractToken(req: Request): string | null {
  if (req.cookies && (req.cookies.chemora_session || req.cookies['__Host-chemora_session'])) {
    return req.cookies.chemora_session || req.cookies['__Host-chemora_session'];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// 2.8: 7-day session cookies with __Host- prefix
function setSessionCookies(res: Response, token: string) {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  res.cookie('chemora_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge,
    path: '/',
  });
  if (isProd) {
    res.cookie('__Host-chemora_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge,
      path: '/',
    });
  }
}

function clearSessionCookies(res: Response) {
  res.clearCookie('chemora_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
  if (isProd) {
    res.clearCookie('__Host-chemora_session', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  }
}

// GET /api/account/status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    databaseConnected: isSupabaseConfigured(),
  });
});

// GET /api/account/database
router.get('/database', (_req: Request, res: Response) => {
  res.json(getSupabaseSystemDiagnostics());
});

// 2.8: Protected Route - Verified server-side session token
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: 'Session expired' });

    const result = await backendGetProgress(verified.id);
    return res.json(result);
  } catch {
    return res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
});

// 2.9: Progress Sync - Verified user_id only, server-side validated
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: 'Session expired' });

    const parsed = SyncProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid progress data schema' });
    }

    const syncResult = await backendSyncProgress(verified.id, parsed.data);
    return res.json(syncResult);
  } catch {
    return res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
});

// GET /api/account/me - Retrieve current researcher profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
    }

    const verified = await verifyUserSessionToken(token);
    if (!verified) {
      return res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
    }

    const profile = await backendGetProfile(verified.id, verified.email, undefined, token);

    return res.json({
      authenticated: true,
      user: {
        id: verified.id,
        email: verified.email,
      },
      profile,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// 2.5 & 2.7: POST /api/account/signup - No token returned in JSON body; cookie only
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parsed = SignUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Password must be at least 10 characters long.' });
    }

    const { email, password, full_name } = parsed.data;
    const result = await backendSignUp(email, password, full_name || '');

    if (result.session?.access_token) {
      setSessionCookies(res, result.session.access_token);
    }

    // 2.5: Never return token in JSON response body
    return res.status(201).json({
      success: true,
      user: result.user,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      message: (result as any).message || 'Researcher account created successfully.',
    });
  } catch (err: any) {
    safeLogError('Signup failed');
    return res.status(400).json({ error: 'Registration failed. Please check your details.' });
  }
});

// 2.5 & 2.7: POST /api/account/login - No token in JSON body; generic responses
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { email, password } = parsed.data;
    const result = await backendSignIn(email, password);

    if (result.session?.access_token) {
      setSessionCookies(res, result.session.access_token);
    }

    // 2.5: Never return token in JSON body
    return res.json({
      success: true,
      user: result.user,
      profile: result.profile,
    });
  } catch {
    // 2.7: Generic error message to prevent enumeration
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
});

// 2.8: POST /api/account/logout - Clear cookie and revoke Supabase session
router.post('/logout', async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (token) {
    try {
      const client = getUserScopedSupabaseClient(token);
      if (client) {
        await client.auth.signOut();
      }
    } catch {
      // Sign-out error ignored
    }
  }
  clearSessionCookies(res);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 2.10: DELETE /api/account/me - Require password re-entry, delete via admin client
router.delete('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: 'Session expired or invalid' });

    const parsed = DeleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Password confirmation is required.' });
    }

    await backendDeleteAccount(verified.id, verified.email, parsed.data.password);
    clearSessionCookies(res);

    return res.json({
      success: true,
      message: 'Your researcher account and learning data have been permanently erased.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete account.' });
  }
});

// PUT /api/account/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const verified = await verifyUserSessionToken(token);
    if (!verified) return res.status(401).json({ error: 'Session expired' });

    const parsed = ProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid profile update format' });
    }

    const updatedProfile = await backendUpdateProfile(
      verified.id,
      verified.email,
      parsed.data,
      token
    );

    return res.json({
      success: true,
      profile: updatedProfile,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /api/account/password - 10 chars minimum
router.put('/password', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const parsed = PasswordUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'New password must be at least 10 characters long.' });
    }

    await backendUpdatePassword(token, parsed.data.new_password);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update password.' });
  }
});

// 2.7: POST /api/account/forgot-password - Generic response, prevents enumeration
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    await backendResetPasswordRequest(parsed.data.email);
    return res.json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.',
    });
  } catch {
    return res.json({
      success: true,
      message: 'If an account exists with that email, password reset instructions have been sent.',
    });
  }
});

export default router;
