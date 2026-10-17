import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  backendSignUp,
  backendSignIn,
  backendGetUserFromToken,
  backendGetProfile,
  backendUpdateProfile,
  backendUpdatePassword,
  backendResetPasswordRequest,
  backendResetPasswordWithToken,
  backendSyncProgress,
  backendGetProgress,
  getSupabaseSystemDiagnostics,
  isSupabaseBackendConfigured,
} from '../supabase.ts';

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

// Strict validation schemas using Zod
export const SignUpSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(6, 'Password must be at least 6 characters').max(120),
  full_name: z.string().trim().max(80).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  password: z.string().min(1, 'Password is required').max(120),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().trim().max(80).optional(),
  avatar_url: z.string().trim().max(255).optional(),
  rank: z.string().trim().max(80).optional(),
});

export const PasswordUpdateSchema = z.object({
  new_password: z.string().min(6, 'New password must be at least 6 characters').max(120),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
});

export const ResetPasswordWithTokenSchema = z.object({
  token: z.string().trim().min(10, 'Invalid token').max(255),
  new_password: z.string().min(6, 'New password must be at least 6 characters').max(120),
});

export const SyncProgressSchema = z.object({
  experimentsCompleted: z.number().int().min(0).max(1000).optional().default(0),
  challengesCompleted: z.number().int().min(0).max(1000).optional().default(0),
  streakDays: z.number().int().min(0).max(10000).optional().default(0),
  totalXp: z.number().int().min(0).max(10000000).optional().default(0),
  rankTitle: z.string().trim().max(100).optional().default('Novice Alchemist'),
  completedExperimentIds: z.array(z.string().trim().max(60)).max(200).optional().default([]),
});

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.chemora_session) {
    return req.cookies.chemora_session;
  }
  return null;
}

// CSRF & Header protection for state-mutating requests
function verifyCsrfHeader(req: Request, res: Response, next: NextFunction) {
  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 1. Bearer token in Authorization header is immune to standard browser CSRF
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 2. Custom header cannot be sent by cross-origin HTML forms
  const customHeader = req.headers['x-requested-with'] || req.headers['x-chemora-client'];
  if (customHeader) {
    return next();
  }

  // 3. Strict Origin / Referer validation
  const rawAllowed = process.env.ALLOWED_ORIGINS || '';
  const configuredOrigins = rawAllowed.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const origin = (req.headers.origin || req.headers.referer || '').toLowerCase();

  if (origin) {
    const isAllowed =
      !isProd ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      configuredOrigins.some((c) => origin.startsWith(c)) ||
      origin.includes('.run.app') ||
      origin.includes('.vercel.app') ||
      origin.includes('chemora');

    if (isAllowed) {
      return next();
    }
  }

  if (!isProd) {
    return next();
  }

  return res.status(403).json({ error: 'CSRF verification rejected request.' });
}

router.use(verifyCsrfHeader);

// GET /api/account/status - Check if backend is active and database configured
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    databaseConnected: isSupabaseBackendConfigured(),
  });
});

// GET /api/account/database - Supabase Database System status and metrics
router.get('/database', (_req: Request, res: Response) => {
  res.json(getSupabaseSystemDiagnostics());
});

// GET /api/account/progress - Retrieve researcher's laboratory progress from database
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await backendGetUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const result = await backendGetProgress(user.id, token);
    return res.json(result);
  } catch (err: any) {
    console.error('Error fetching researcher progress:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch progress' });
  }
});

// POST /api/account/sync - Sync researcher progress & laboratory data into database
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await backendGetUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const parsed = SyncProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid progress data schema', details: parsed.error.issues });
    }

    const syncResult = await backendSyncProgress(
      user.id,
      parsed.data,
      token
    );

    return res.json(syncResult);
  } catch (err: any) {
    console.error('Error syncing researcher progress:', err);
    return res.status(500).json({ error: err.message || 'Failed to sync progress' });
  }
});

// GET /api/account/me - Retrieve current researcher profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
    }

    const user = await backendGetUserFromToken(token);
    if (!user) {
      return res.status(401).json({ authenticated: false, error: 'Session expired or invalid' });
    }

    const profile = await backendGetProfile(
      user.id,
      user.email || '',
      (user as any).user_metadata?.full_name,
      token
    );

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Error fetching /api/account/me:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/account/signup - Register new researcher
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parsed = SignUpSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid registration details.';
      return res.status(400).json({ error: message, details: parsed.error.issues });
    }

    const { email, password, full_name } = parsed.data;
    const result = await backendSignUp(email, password, full_name || '');

    if (result.token) {
      res.cookie('chemora_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    return res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
      message: result.requiresEmailConfirmation
        ? 'Account registered. Please verify your email to continue.'
        : 'Welcome to CHEMORA! Your researcher account is ready.',
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    let msg = err?.message || 'Registration failed.';
    if (msg.toLowerCase().includes('invalid api') || msg.toLowerCase().includes('apikey')) {
      msg = 'Unable to connect to remote directory. Switched to local laboratory session.';
    }
    return res.status(400).json({ error: msg });
  }
});

// POST /api/account/login - Sign into researcher account
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Please enter both email and password.';
      return res.status(400).json({ error: message, details: parsed.error.issues });
    }

    const { email, password } = parsed.data;
    const result = await backendSignIn(email, password);

    if (result.token) {
      res.cookie('chemora_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return res.json({
      success: true,
      user: result.user,
      profile: result.profile,
      token: result.token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    let msg = err?.message || 'Invalid email or password.';
    if (msg.toLowerCase().includes('invalid api') || msg.toLowerCase().includes('apikey')) {
      msg = 'Authentication credential issue. Please re-enter your password.';
    }
    return res.status(401).json({ error: msg });
  }
});

// POST /api/account/logout - Sign out
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('chemora_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// PUT /api/account/profile - Update researcher profile details
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await backendGetUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const parsed = ProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid profile update format', details: parsed.error.issues });
    }

    const updatedProfile = await backendUpdateProfile(
      user.id,
      user.email || '',
      parsed.data,
      token
    );

    return res.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

// PUT /api/account/password - Change password
router.put('/password', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const parsed = PasswordUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'New password must be at least 6 characters.';
      return res.status(400).json({ error: message });
    }

    await backendUpdatePassword(token, parsed.data.new_password);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(400).json({ error: err.message || 'Failed to update password.' });
  }
});

// POST /api/account/forgot-password - Send password reset email or generate token
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const result = await backendResetPasswordRequest(parsed.data.email);
    return res.json(result);
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(400).json({ error: err.message || 'Failed to request reset.' });
  }
});

// POST /api/account/reset-password - Reset password using single-use expiring token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const parsed = ResetPasswordWithTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Valid reset token and password are required.';
      return res.status(400).json({ error: message });
    }

    const result = await backendResetPasswordWithToken(parsed.data.token, parsed.data.new_password);
    return res.json(result);
  } catch (err: any) {
    console.error('Reset password with token error:', err);
    return res.status(400).json({ error: err.message || 'Failed to reset password.' });
  }
});

export default router;
