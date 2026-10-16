import express from 'express';
import type { Request, Response } from 'express';
import {
  backendSignUp,
  backendSignIn,
  backendGetUserFromToken,
  backendGetProfile,
  backendUpdateProfile,
  backendUpdatePassword,
  backendResetPasswordRequest,
  backendSyncProgress,
  backendGetProgress,
  getSupabaseSystemDiagnostics,
  isSupabaseBackendConfigured,
} from '../supabase.ts';

const router = express.Router();

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

// GET /api/account/status - Check if backend is active and database configured (WITHOUT exposing credentials)
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

// POST /api/account/sync - Sync researcher progress & laboratory data into Supabase database
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

    const {
      experimentsCompleted,
      challengesCompleted,
      streakDays,
      totalXp,
      rankTitle,
      completedExperimentIds,
    } = req.body || {};

    const syncResult = await backendSyncProgress(
      user.id,
      {
        experimentsCompleted: Number(experimentsCompleted || 0),
        challengesCompleted: Number(challengesCompleted || 0),
        streakDays: Number(streakDays || 0),
        totalXp: Number(totalXp || 0),
        rankTitle: rankTitle || 'Novice Alchemist',
        completedExperimentIds: Array.isArray(completedExperimentIds) ? completedExperimentIds : [],
      },
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
    const { email, password, full_name } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const result = await backendSignUp(email, password, full_name || '');

    if (result.token) {
      res.cookie('chemora_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
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
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const result = await backendSignIn(email, password);

    if (result.token) {
      res.cookie('chemora_session', result.token, {
        httpOnly: true,
        sameSite: 'lax',
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
  res.clearCookie('chemora_session');
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

    const { full_name, avatar_url, rank } = req.body || {};

    const updatedProfile = await backendUpdateProfile(
      user.id,
      user.email || '',
      { full_name, avatar_url, rank },
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

    const { new_password } = req.body || {};
    if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    await backendUpdatePassword(token, new_password);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Password change error:', err);
    return res.status(400).json({ error: err.message || 'Failed to update password.' });
  }
});

// POST /api/account/forgot-password - Send password reset email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const result = await backendResetPasswordRequest(email);
    return res.json(result);
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(400).json({ error: err.message || 'Failed to request reset.' });
  }
});

export default router;
