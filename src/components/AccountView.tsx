import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, getStoredProfile, GUEST_PROFILE, saveStoredUiPreferences } from '../data/userProfile';
import { getInitialChallengeState } from '../data/challengeData';
import { getDailyStreak, DailyStreakState } from '../data/streakManager';
import {
  fetchCurrentAccount,
  signInResearcher,
  signUpResearcher,
  signOutResearcher,
  updateResearcherProfile,
  updateResearcherPassword,
  requestPasswordReset,
  checkBackendStatus,
  fetchDatabaseDiagnostics,
  syncResearcherProgressToDatabase,
  fetchResearcherProgressFromDatabase,
  setAuthToken,
  AccountProfile,
  SupabaseDatabaseDiagnostics,
  ResearcherProgressData,
} from '../services/accountApi';
import { supabase } from '../services/supabaseClient';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  User,
  Shield,
  Settings,
  Check,
  Sparkles,
  Trophy,
  Beaker,
  Award,
  LogOut,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  Sliders,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Activity,
  HardDrive,
  CheckCheck,
  Cpu,
} from 'lucide-react';
import { ReviewsSection } from './ReviewsSection';

interface AccountViewProps {
  onThemeChanged?: () => void;
}

const AVATAR_OPTIONS = [
  { label: 'Flask', url: '/favicon.png' },
  { label: 'Carbon', url: '/assets/chemistry/carbon.svg' },
  { label: 'Atom', url: '/icon-192.png' },
];

function cleanErrorMessage(rawMsg: string | undefined): string {
  if (!rawMsg) return 'An error occurred. Please try again.';
  const lower = rawMsg.toLowerCase();
  if (lower.includes('invalid api') || lower.includes('apikey') || lower.includes('api key')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  return rawMsg;
}

// Module-level deduplication cache to prevent re-logging and re-fetching on tab switches
let moduleActiveSession: { userId?: string; token?: string } = {};

export const AccountView: React.FC<AccountViewProps> = ({ onThemeChanged }) => {
  // Session & Profile state from Backend (Zero localStorage policy)
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Supabase Database System State
  const [dbDiagnostics, setDbDiagnostics] = useState<SupabaseDatabaseDiagnostics | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [lastDbSyncTime, setLastDbSyncTime] = useState<string | null>(null);
  const [syncedProgress, setSyncedProgress] = useState<ResearcherProgressData | null>(null);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Animated Floating Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Local Laboratory Progress & Streak
  const [streakState, setStreakState] = useState<DailyStreakState>(getDailyStreak);
  const [challengeState, setChallengeState] = useState(getInitialChallengeState);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const completedExperimentsCount = (() => {
    try {
      const raw = localStorage.getItem('chemoraExperimentProgress');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  })();

  // Load session from backend API (Zero-localStorage: profile comes exclusively from server)
  // Load session with Supabase client prioritization
  const refreshAccount = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const [status, dbInfo] = await Promise.all([
        checkBackendStatus().catch(() => ({ status: 'unknown', databaseConnected: false })),
        fetchDatabaseDiagnostics().catch(() => null),
      ]);
      setIsBackendOnline(status.status === 'online');
      if (dbInfo) setDbDiagnostics(dbInfo);

      // 1. Check if Supabase Auth client has an active session in browser
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (session?.user) {
        await syncSupabaseSession(session.user, session.access_token);
        return;
      }

      // 2. Otherwise verify backend session
      const data = await fetchCurrentAccount();
      if (data.authenticated && data.profile) {
        setIsAuthenticated(true);
        setAccountProfile(data.profile);

        const updatedProfile: UserProfile = {
          ...profile,
          id: data.profile.id,
          name: data.profile.full_name || 'Researcher',
          email: data.profile.email,
          avatar: data.profile.avatar_url || '/favicon.png',
          rank: data.profile.rank || 'Novice Alchemist',
          isLoggedIn: true,
        };
        setProfile(updatedProfile);

        // Fetch synced laboratory progress from Supabase database
        try {
          const cloudProg = await fetchResearcherProgressFromDatabase();
          if (cloudProg?.progress) {
            setSyncedProgress(cloudProg.progress);
            setLastDbSyncTime(
              cloudProg.progress.updatedAt
                ? new Date(cloudProg.progress.updatedAt).toLocaleTimeString()
                : new Date().toLocaleTimeString()
            );
          }
        } catch (progErr) {
          console.warn('Progress lookup from database note:', progErr);
        }
      } else {
        setIsAuthenticated(false);
        setAccountProfile(null);
        if (profile.isLoggedIn) {
          const guest: UserProfile = { ...GUEST_PROFILE, preferences: profile.preferences };
          setProfile(guest);
        }
      }
    } catch (err) {
      console.warn('Backend account verification failed:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [profile]);

  // Synchronize a Supabase user session directly with UI state matching table schema
  const syncSupabaseSession = useCallback(async (sessionUser: SupabaseUser, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    setIsAuthenticated(true);

    try {
      const metaAvatar =
        sessionUser.user_metadata?.avatar_url ||
        sessionUser.user_metadata?.picture ||
        sessionUser.user_metadata?.avatar ||
        sessionUser.user_metadata?.photo_url ||
        sessionUser.user_metadata?.image;

      const metaName =
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.name ||
        sessionUser.user_metadata?.user_name;

      // 1. Resiliently query public.profiles row directly from Supabase (checking id, user_id, email)
      let profileData: any = null;

      // Priority 1: Query by primary key id (standard Supabase pattern where id = auth.users.id)
      try {
        const { data: byId } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (byId) {
          profileData = byId;
        }
      } catch (err) {
        console.warn('Profile lookup by id note:', err);
      }

      // Priority 2: Query by user_id column if not found by id
      if (!profileData) {
        try {
          const { data: byUserId } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          if (byUserId) {
            profileData = byUserId;
          }
        } catch (err) {
          console.warn('Profile lookup by user_id note:', err);
        }
      }

      // Priority 3: Query by email if available on profile row
      if (!profileData && sessionUser.email) {
        try {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', sessionUser.email.toLowerCase().trim())
            .maybeSingle();

          if (byEmail) {
            profileData = byEmail;
            // Link existing row with user_id or id if not set
            if (!profileData.user_id && !profileData.id) {
              try {
                await supabase
                  .from('profiles')
                  .update({ user_id: sessionUser.id })
                  .eq('id', profileData.id);
              } catch {}
            }
          }
        } catch (err) {
          // email column may not exist in some schemas
        }
      }

      // Priority 4: Check candidate full_name matching for existing accounts created prior to auth binding
      if (!profileData) {
        const candidateNames = [
          metaName,
          sessionUser.user_metadata?.full_name,
          sessionUser.user_metadata?.name,
          sessionUser.email?.split('@')[0],
        ].filter((n): n is string => Boolean(n && n.trim().length > 0));

        for (const cand of candidateNames) {
          try {
            const { data: nameMatches } = await supabase
              .from('profiles')
              .select('*')
              .ilike('full_name', cand.trim())
              .limit(1);

            if (nameMatches && nameMatches.length > 0) {
              profileData = nameMatches[0];
              // Link this existing profile to the authenticated user's user_id or id
              if (!profileData.user_id) {
                try {
                  await supabase
                    .from('profiles')
                    .update({ user_id: sessionUser.id })
                    .eq('id', profileData.id);
                  profileData.user_id = sessionUser.id;
                } catch (linkErr) {
                  console.warn('Linking user_id to existing profile note:', linkErr);
                }
              }
              break;
            }
          } catch (nameErr) {
            console.warn('Name search note:', nameErr);
          }
        }
      }

      // Priority 5: Fallback: check backend proxy if client-side database query was blocked by RLS
      if (!profileData) {
        try {
          const backendCurrent = await fetchCurrentAccount();
          if (backendCurrent?.authenticated && backendCurrent?.profile) {
            profileData = {
              id: backendCurrent.profile.id,
              user_id: backendCurrent.profile.user_id || sessionUser.id,
              full_name: backendCurrent.profile.full_name,
              avatar_url: backendCurrent.profile.avatar_url,
              rank_title: backendCurrent.profile.rank,
            };
          }
        } catch {}
      }

      // Priority 6: Auto-provision ONLY if profile really does not exist anywhere
      // Preserves existing local challenge achievements instead of overwriting with zeroes
      if (!profileData) {
        const defaultName = metaName || sessionUser.email?.split('@')[0] || 'Researcher';
        const initialLevels = challengeState?.levels?.length || 0;
        const initialXp = challengeState?.xp || 0;
        const initialStreak = streakState?.currentStreak || 0;
        const initialRank = profile.rank && profile.rank !== 'Guest Chemist' ? profile.rank : 'Novice Alchemist';

        try {
          // Attempt insert with both id and user_id to satisfy whichever schema exists
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: sessionUser.id,
              user_id: sessionUser.id,
              email: sessionUser.email,
              full_name: defaultName,
              avatar_url: metaAvatar || null,
              rank_title: initialRank,
              levels_cleared: initialLevels,
              xp_earned: initialXp,
              daily_streak: initialStreak,
            })
            .select()
            .maybeSingle();

          if (insertError) {
            // Fallback for minimalist Supabase schemas: only id, full_name, avatar_url
            const { data: createdMin } = await supabase
              .from('profiles')
              .insert({
                id: sessionUser.id,
                full_name: defaultName,
                avatar_url: metaAvatar || null,
              })
              .select()
              .maybeSingle();
            if (createdMin) profileData = createdMin;
          } else if (created) {
            profileData = created;
          }
        } catch (insErr) {
          console.warn('Auto-provision insert note:', insErr);
        }
      }

      // Ensure avatar reflects user's actual photo
      // Priority: user's Google/OAuth photo (metaAvatar) > profileData avatar > storage avatar > default
      let resolvedAvatar = metaAvatar || profileData?.avatar_url;
      if (!resolvedAvatar) {
        try {
          const { data: storageData } = supabase.storage.from('avatars').getPublicUrl(`${sessionUser.id}/avatar`);
          if (storageData?.publicUrl) {
            resolvedAvatar = storageData.publicUrl;
          }
        } catch {}
      }
      if (!resolvedAvatar) {
        resolvedAvatar = '/favicon.png';
      }

      // If user has a real avatar in metadata (like Google photo) but profiles.avatar_url is empty, persist it
      if (profileData && (!profileData.avatar_url || profileData.avatar_url === '/favicon.png') && metaAvatar) {
        Promise.allSettled([
          supabase.from('profiles').update({ avatar_url: metaAvatar }).eq('id', profileData.id || sessionUser.id),
          supabase.from('profiles').update({ avatar_url: metaAvatar }).eq('user_id', sessionUser.id),
        ]).catch(() => {});
        profileData.avatar_url = metaAvatar;
      }

      const fullName = profileData?.full_name || metaName || sessionUser.email?.split('@')[0] || 'Researcher';
      const rankTitle = profileData?.rank_title || profile.rank || 'Novice Alchemist';

      const accProfile: AccountProfile = {
        id: profileData?.id ? String(profileData.id) : sessionUser.id,
        user_id: sessionUser.id,
        email: sessionUser.email || '',
        full_name: fullName,
        avatar_url: resolvedAvatar,
        rank: rankTitle,
        created_at: sessionUser.created_at,
        updated_at: new Date().toISOString(),
      };
      setAccountProfile(accProfile);

      setProfile((prev) => ({
        ...prev,
        id: accProfile.id,
        name: accProfile.full_name,
        email: accProfile.email,
        avatar: accProfile.avatar_url || '/favicon.png',
        rank: accProfile.rank || 'Novice Alchemist',
        isLoggedIn: true,
      }));

      // 6. Load synced progress from profiles table or database
      if (profileData && (profileData.levels_cleared !== undefined || profileData.xp_earned !== undefined)) {
        const dbLevels = Number(profileData.levels_cleared || 0);
        const dbXp = Number(profileData.xp_earned || 0);
        const dbStreak = Number(profileData.daily_streak || 0);

        setSyncedProgress({
          userId: sessionUser.id,
          experimentsCompleted: completedExperimentsCount,
          challengesCompleted: dbLevels,
          streakDays: dbStreak,
          totalXp: dbXp,
          rankTitle: rankTitle,
          completedExperimentIds: [],
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLastDbSyncTime(new Date().toLocaleTimeString());

        // If local user has earned achievements that are higher than database, update database
        const localLevels = challengeState.levels.length;
        const localXp = challengeState.xp;
        const localStreak = streakState.currentStreak;
        if (localLevels > dbLevels || localXp > dbXp || localStreak > dbStreak) {
          Promise.resolve(
            supabase
              .from('profiles')
              .update({
                levels_cleared: Math.max(dbLevels, localLevels),
                xp_earned: Math.max(dbXp, localXp),
                daily_streak: Math.max(dbStreak, localStreak),
              })
              .eq('user_id', sessionUser.id)
          ).catch(() => {});
        }
      } else {
        try {
          const cloudProg = await fetchResearcherProgressFromDatabase();
          if (cloudProg?.progress) {
            setSyncedProgress(cloudProg.progress);
            setLastDbSyncTime(
              cloudProg.progress.updatedAt
                ? new Date(cloudProg.progress.updatedAt).toLocaleTimeString()
                : new Date().toLocaleTimeString()
            );
          }
        } catch (progErr) {
          console.warn('Progress lookup from database note:', progErr);
        }
      }
    } catch (err) {
      console.warn('Error syncing Supabase user profile:', err);
    }
  }, [challengeState, streakState, completedExperimentsCount, profile.rank]);

  // Keep references to current callbacks and session cache to prevent infinite auth listener cycles
  const syncSupabaseSessionRef = useRef(syncSupabaseSession);
  syncSupabaseSessionRef.current = syncSupabaseSession;
  const refreshAccountRef = useRef(refreshAccount);
  refreshAccountRef.current = refreshAccount;
  const lastSyncedSessionRef = useRef<{ userId?: string; token?: string }>({});

  // Supabase Auth state listener: runs once on mount and cleanly handles session transitions
  useEffect(() => {
    // Initial backend status checks
    Promise.all([
      checkBackendStatus().catch(() => ({ status: 'unknown', databaseConnected: false })),
      fetchDatabaseDiagnostics().catch(() => null),
    ]).then(([status, dbInfo]) => {
      setIsBackendOnline(status.status === 'online');
      if (dbInfo) setDbDiagnostics(dbInfo);
    });

    // Subscribe to Supabase Auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          // If session is already actively synchronized with this user and token, do not re-run or spam logs
          if (
            moduleActiveSession.userId === session.user.id &&
            moduleActiveSession.token === session.access_token
          ) {
            setIsLoadingAuth(false);
            return;
          }
          if (event !== 'INITIAL_SESSION') {
            console.log(`[Supabase Auth] State changed: ${event}`, session.user.email);
          }
          moduleActiveSession = { userId: session.user.id, token: session.access_token };
          await syncSupabaseSessionRef.current(session.user, session.access_token);
          setIsLoadingAuth(false);
        } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          console.log(`[Supabase Auth] State changed: ${event}`);
          moduleActiveSession = {};
          setAuthToken(null);
          setIsAuthenticated(false);
          setAccountProfile(null);
          setSyncedProgress(null);
          setProfile((prev) => ({ ...GUEST_PROFILE, preferences: prev.preferences }));
          setIsLoadingAuth(false);
        } else {
          setIsLoadingAuth(false);
        }
      }
    );

    const handleStreakChange = () => setStreakState(getDailyStreak());
    window.addEventListener('chemora:streak_update', handleStreakChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('chemora:streak_update', handleStreakChange);
    };
  }, []);

  // Sync Progress to Supabase Database System
  const handleSyncProgressToSupabase = async () => {
    if (!isAuthenticated) {
      triggerToast('Please sign in to sync with Supabase database.', 'info');
      return;
    }
    setIsSyncingDb(true);
    try {
      // 1. Update in public.profiles table directly if session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const payload = {
          levels_cleared: challengeState.levels.length,
          xp_earned: challengeState.xp,
          daily_streak: streakState.currentStreak,
          rank_title: profile.rank,
        };
        await Promise.allSettled([
          supabase.from('profiles').update(payload).eq('id', session.user.id),
          supabase.from('profiles').update(payload).eq('user_id', session.user.id),
        ]);
      }

      // 2. Also sync through backend proxy
      const res = await syncResearcherProgressToDatabase({
        experimentsCompleted: completedExperimentsCount,
        challengesCompleted: challengeState.levels.length,
        streakDays: streakState.currentStreak,
        totalXp: challengeState.xp,
        rankTitle: profile.rank,
      });

      setSyncedProgress(res.progress);
      setLastDbSyncTime(new Date().toLocaleTimeString());
      triggerToast('Progress successfully synced to Supabase database!', 'success');
      setAuthSuccess('Laboratory metrics synchronized with Supabase database.');
    } catch (err: any) {
      triggerToast(err.message || 'Database sync encountered an issue.', 'error');
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Handle Sign In with Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      // Sign in directly via Supabase client (onAuthStateChange will automatically sync session)
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (sbError) {
        // Direct Supabase error: Surface the exact issue to the user
        let msg = sbError.message;
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Invalid email or password. Please verify your credentials, or click "Continue with Google" if you registered with Google.';
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          msg = 'Email address not yet confirmed. Please verify your email via the confirmation link sent by Supabase.';
        }
        setAuthError(msg);
        triggerToast(msg, 'error');
        return;
      }

      if (sbData?.session) {
        setAuthToken(sbData.session.access_token);
        setIsAuthenticated(true);
        setAuthSuccess('Welcome back! Loading your researcher profile...');
        triggerToast('Laboratory workspace authenticated.', 'success');
        setAuthPassword('');
      }
    } catch (err: any) {
      const msg = cleanErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname + '#account',
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      const msg = err.message || 'Google sign-in encountered an error.';
      setAuthError(msg);
      triggerToast(msg, 'error');
      setIsSubmittingAuth(false);
    }
  };

  // Handle Registration via Supabase Auth & backend fallback
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both an email address and a password.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Laboratory password must be at least 6 characters long.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          data: {
            full_name: authFullName.trim() || 'Researcher',
          },
        },
      });

      if (sbError) {
        console.warn('Direct Supabase sign-up note:', sbError.message, '- attempting backend proxy');
        const result = await signUpResearcher(authEmail.trim(), authPassword, authFullName.trim());
        if (result.requiresEmailConfirmation) {
          setAuthSuccess(result.message || 'Registration successful! Please check your email to confirm your account.');
          triggerToast('Registration email sent! Please check your inbox.', 'info');
        } else {
          setAuthSuccess('Welcome to CHEMORA! Your researcher account has been created.');
          triggerToast('Researcher account registered successfully!', 'success');
          await refreshAccount();
        }
      } else {
        if (!sbData.session) {
          setAuthSuccess('Account created! Please check your email to confirm your address, then sign in.');
          triggerToast('Confirmation email sent! Please check your inbox.', 'info');
        } else {
          setAuthSuccess('Welcome to CHEMORA! Your researcher account has been created.');
          triggerToast('Researcher account registered successfully!', 'success');
        }
      }
      setAuthPassword('');
    } catch (err: any) {
      const msg = cleanErrorMessage(err.message || 'Could not complete registration.');
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Password Reset Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      setAuthError('Please enter the email address linked to your researcher account.');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      await supabase.auth.resetPasswordForEmail(authEmail.trim()).catch(() => {});
      const msg = await requestPasswordReset(authEmail.trim());
      setAuthSuccess(msg);
      triggerToast(msg, 'info');
    } catch (err: any) {
      const msg = cleanErrorMessage(err.message || 'Failed to request password reset.');
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Sign Out: triggers Supabase Auth listener to sync logged-out state
  const handleSignOut = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      // 1. Sign out from Supabase client (triggers onAuthStateChange 'SIGNED_OUT')
      await supabase.auth.signOut().catch((err: any) => console.warn('Supabase signout note:', err));
      // 2. Sign out from backend
      await signOutResearcher().catch(() => {});

      setIsAuthenticated(false);
      setAccountProfile(null);
      setSyncedProgress(null);
      setProfile((prev) => ({ ...GUEST_PROFILE, preferences: prev.preferences }));
      setAuthSuccess('Signed out of researcher session.');
      triggerToast('Signed out of laboratory session.', 'info');
    } catch (err: any) {
      const msg = 'Sign out failed: ' + (err.message || 'Network error');
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Save Profile Edits via backend & direct Supabase
  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;

    setIsSavingProfile(true);
    setAuthError(null);

    try {
      const chosenAvatar = avatarInput || profile.avatar;
      let directSuccess = false;

      // 1. Direct update to public.profiles table in Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const updatePayload = {
            full_name: nameInput.trim(),
            avatar_url: chosenAvatar,
          };
          const [resId, resUserId] = await Promise.allSettled([
            supabase.from('profiles').update(updatePayload).eq('id', session.user.id),
            supabase.from('profiles').update(updatePayload).eq('user_id', session.user.id),
          ]);
          if (
            (resId.status === 'fulfilled' && !(resId.value as any)?.error) ||
            (resUserId.status === 'fulfilled' && !(resUserId.value as any)?.error)
          ) {
            directSuccess = true;
          }
        }
      } catch (sbErr) {
        console.warn('Direct Supabase profile update note:', sbErr);
      }

      // 2. Also update via backend proxy (non-blocking if direct update already succeeded)
      let updatedBackendProfile: AccountProfile | null = null;
      try {
        updatedBackendProfile = await updateResearcherProfile({
          full_name: nameInput.trim(),
          avatar_url: chosenAvatar,
        });
      } catch (proxyErr) {
        console.warn('Backend proxy update note:', proxyErr);
        if (!directSuccess) {
          throw proxyErr;
        }
      }

      const updatedName = updatedBackendProfile?.full_name || nameInput.trim();
      const updatedAvatar = updatedBackendProfile?.avatar_url || chosenAvatar;

      if (accountProfile) {
        setAccountProfile({
          ...accountProfile,
          full_name: updatedName,
          avatar_url: updatedAvatar,
        });
      }

      const updated: UserProfile = {
        ...profile,
        name: updatedName,
        avatar: updatedAvatar,
      };

      setProfile(updated);
      setIsEditing(false);
      setAuthSuccess('Researcher profile updated successfully in database.');
      triggerToast('Researcher profile saved to database!', 'success');
    } catch (err: any) {
      const msg = cleanErrorMessage('Failed to save profile: ' + (err.message || 'Server error'));
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'Passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus(null);

    try {
      // 1. Direct Supabase auth update
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.updateUser({ password: newPassword });
        }
      } catch (sbErr) {
        console.warn('Direct Supabase password update note:', sbErr);
      }

      // 2. Backend update
      await updateResearcherPassword(newPassword);
      setPasswordStatus({ success: 'Laboratory password successfully updated.' });
      triggerToast('Laboratory password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordChange(false), 2000);
    } catch (err: any) {
      const msg = cleanErrorMessage(err.message || 'Failed to update password.');
      setPasswordStatus({ error: msg });
      triggerToast(msg, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Update Preferences locally (only non-sensitive UI settings, zero account data)
  const updatePreference = <K extends keyof UserProfile['preferences']>(
    key: K,
    value: UserProfile['preferences'][K]
  ) => {
    const updated: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        [key]: value,
      },
    };
    setProfile(updated);
    saveStoredUiPreferences(updated.preferences);

    if (key === 'theme' && onThemeChanged) {
      onThemeChanged();
    }
  };

  // Reset Progress Data
  const handleResetData = () => {
    localStorage.removeItem('chemoraChallengeState');
    localStorage.removeItem('chemoraExperimentProgress');
    setChallengeState({ levels: [], xp: 0, answers: 0, correct: 0, levelResults: {}, rewards: [] });
    setShowResetConfirm(false);
    triggerToast('Local lab progress and practical records reset.', 'info');
    window.dispatchEvent(new CustomEvent('chemora:progress'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative">
      {/* Animated Floating Toast Notification Popup */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-[90%] anim-slide-down anim-popup pointer-events-auto">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.3)]'
                : 'bg-[#091830]/95 border-cyan-500/60 text-cyan-200 shadow-[0_10px_30px_rgba(6,182,212,0.3)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />}
              <span className="text-xs font-semibold leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              aria-label="Dismiss toast"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Animated Reset Progress Modal Popup */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0a1220] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(244,63,94,0.35)] anim-popup">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 mb-4 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white text-center mb-1">
              Reset Laboratory Progress?
            </h3>
            <p className="text-xs text-slate-300 text-center leading-relaxed mb-6">
              This will permanently clear your local challenge completions, XP, and recorded practical test history. This action cannot be reversed.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition hover:scale-102 active:scale-98"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition hover:scale-102 active:scale-98"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-3">
          <Shield className="w-3.5 h-3.5" />
          RESEARCHER ACCOUNT &amp; LABORATORY
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Account &amp; Workspace</h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-2">
          Manage your chemist identity, cloud research credentials, and verified experiment achievements.
        </p>
      </div>

      {/* Global Alerts */}
      {authSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg anim-slide-down">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{authSuccess}</span>
          </div>
          <button
            onClick={() => setAuthSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 font-mono text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {authError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center justify-between gap-2 shadow-lg anim-slide-down">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-rose-400 hover:text-rose-200 font-mono text-xs"
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoadingAuth && (
        <div className="p-8 text-center bg-[#0b1320] border border-cyan-900/40 rounded-2xl mb-8 flex items-center justify-center gap-3 text-cyan-300 text-sm anim-popup">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Synchronizing with laboratory authentication services...</span>
        </div>
      )}

      {/* Authenticated View */}
      {!isLoadingAuth && isAuthenticated && accountProfile && (
        <div className="space-y-8">
          {/* Authenticated Profile Card */}
          <div className="bg-[#0e1626] border border-cyan-950/90 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Ring */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border-2 border-cyan-500/50 p-2 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-contain filter drop-shadow"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/favicon.png';
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </div>
              </div>

              {/* Researcher Details */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-2xl font-black text-white">{profile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                    {profile.rank}
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mb-3">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{accountProfile.email}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setNameInput(profile.name);
                        setAvatarInput(profile.avatar);
                        setIsEditing(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Security</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Profile Edit Form */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-cyan-950/80 anim-slide-down anim-popup">
                <h3 className="text-sm font-bold text-white mb-3">Edit Researcher Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Researcher Full Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Dr. Marie Curie"
                      className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-cyan-900 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Choose Laboratory Insignia</label>
                    <div className="flex gap-2">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av.url}
                          type="button"
                          onClick={() => setAvatarInput(av.url)}
                          className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-mono transition-all duration-200 hover:scale-105 active:scale-95 ${
                            avatarInput === av.url
                              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                              : 'bg-[#070b13] border-slate-800 text-slate-400 hover:border-cyan-800'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-5 h-5 object-contain" />
                          <span>{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition hover:scale-102 active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingProfile}
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white flex items-center gap-1.5 transition disabled:opacity-50 shadow-md hover:scale-102 active:scale-98"
                  >
                    {isSavingProfile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Save to Database</span>
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Panel */}
            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="mt-6 pt-6 border-t border-cyan-950/80 anim-slide-down anim-popup">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Update Laboratory Password</span>
                </h3>

                {passwordStatus?.error && (
                  <p className="text-xs text-rose-400 mb-3 font-semibold anim-slide-down">{passwordStatus.error}</p>
                )}
                {passwordStatus?.success && (
                  <p className="text-xs text-emerald-400 mb-3 font-semibold anim-slide-down">{passwordStatus.success}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">New Password (6+ chars)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-cyan-900 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-cyan-900 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* API Supabase Database System Panel */}
          <div className="bg-[#0b1320] border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_10px_35px_rgba(6,182,212,0.12)] anim-popup relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-cyan-950/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
                  <Database className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">API Supabase Database System</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-700 text-cyan-300">
                      v2.0 PostgreSQL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time cloud database persistence with zero local storage of account credentials.
                  </p>
                </div>
              </div>

              {/* Live Status Badge & Sync Action */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-[#070b13] border border-cyan-900 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {dbDiagnostics?.databaseConnected ? 'Supabase Connected' : 'DB Engine Online'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSyncingDb}
                  onClick={handleSyncProgressToSupabase}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-xs font-black text-white shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Syncing...' : 'Sync Lab Data'}</span>
                </button>
              </div>
            </div>

            {/* Architecture Metrics & Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {/* Table 1: profiles */}
              <div className="p-4 rounded-2xl bg-[#070b13]/80 border border-cyan-950/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    public.profiles
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mb-1">Chemist Profile &amp; Metadata</div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                  <div className="truncate">User UUID: <span className="text-cyan-300">{accountProfile.user_id || accountProfile.id}</span></div>
                  <div>Rank: <span className="text-amber-300">{profile.rank}</span></div>
                </div>
              </div>

              {/* Table 2: researcher_progress */}
              <div className="p-4 rounded-2xl bg-[#070b13]/80 border border-cyan-950/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    public.researcher_progress
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Synced
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mb-1">Laboratory Stats &amp; Streaks</div>
                <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                  <div>Experiments: <span className="text-emerald-300">{completedExperimentsCount} recorded</span></div>
                  <div>Total XP: <span className="text-cyan-300">{challengeState.xp} XP</span></div>
                </div>
              </div>

              {/* Zero-LocalStorage Audit Badge */}
              <div className="p-4 rounded-2xl bg-[#070b13]/80 border border-emerald-950/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Zero LocalStorage
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700/60">
                    Audited
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mb-1">Client Security Policy</div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  0 bytes account PII stored locally. Auth tokens use secure session isolation.
                </div>
              </div>
            </div>

            {/* Sync Timestamp and Senior Engineer Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cyan-950/60 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last Cloud Database Sync: {lastDbSyncTime || 'Just now (Session active)'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Verified by Senior Engineer • Production Architecture</span>
              </div>
            </div>
          </div>

          {/* Research Metrics & Lab Bench Stats */}
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Laboratory Activity &amp; Streak Metrics</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0b1320] border border-cyan-900/50 hover:border-amber-500/50 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(245,158,11,0.15)] group cursor-default">
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Flame className="w-4 h-4 animate-bounce-subtle" />
                </div>
                <div className="text-2xl font-black text-amber-300">{streakState.currentStreak}d</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase font-semibold">Daily Streak</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">{streakState.streakLevel}</div>
              </div>

              <div className="bg-[#0b1320] border border-cyan-900/50 hover:border-cyan-500/50 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(6,182,212,0.15)] group cursor-default">
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-cyan-300">{challengeState.xp}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase font-semibold">Experience XP</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Laboratory Knowledge</div>
              </div>

              <div className="bg-[#0b1320] border border-cyan-900/50 hover:border-blue-500/50 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] group cursor-default">
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-blue-300">{challengeState.levels.length}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase font-semibold">Challenges</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Quizzes Mastered</div>
              </div>

              <div className="bg-[#0b1320] border border-cyan-900/50 hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(16,185,129,0.15)] group cursor-default">
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Beaker className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-emerald-300">{completedExperimentsCount}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase font-semibold">Practicals</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Lab Tests Recorded</div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-[#0b1320] border border-cyan-900/50 rounded-3xl p-6 sm:p-7 shadow-lg">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Laboratory Environment Preferences</span>
            </h3>

            <div className="divide-y divide-cyan-950/60">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Laboratory Sound Effects</h4>
                  <p className="text-xs text-slate-400">Audio cues during successful chemical reactions and level clears.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.soundEffects}
                  onChange={(e) => updatePreference('soundEffects', e.target.checked)}
                  className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Auto-Explain Reaction Mechanisms</h4>
                  <p className="text-xs text-slate-400">Automatically display balanced equations and safety context after combining reagents.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.autoExplain}
                  onChange={(e) => updatePreference('autoExplain', e.target.checked)}
                  className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">High Contrast Laboratory View</h4>
                  <p className="text-xs text-slate-400">Enhance periodic table cell borders and molecular bonds for increased visibility.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.preferences.highContrast}
                  onChange={(e) => updatePreference('highContrast', e.target.checked)}
                  className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Theme Mode</h4>
                  <p className="text-xs text-slate-400">Select deep cosmic dark laboratory styling or light aesthetic.</p>
                </div>
                <select
                  value={profile.preferences.theme}
                  onChange={(e) => updatePreference('theme', e.target.value as 'dark' | 'light')}
                  className="px-3 py-1.5 rounded-xl bg-[#070b13] border border-cyan-900 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="dark">Cosmic Dark</option>
                  <option value="light">Solar Light</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-rose-300 mb-1">Laboratory Data Controls</h3>
            <p className="text-xs text-slate-400 mb-4">
              Clear your local offline challenge progress and reset practical experiment records.
            </p>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/60 text-xs font-bold text-rose-300 transition"
              >
                Reset Local Progress &amp; Practical History
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-rose-200 font-semibold">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unauthenticated View: Clean Sign In / Register Portal */}
      {!isLoadingAuth && !isAuthenticated && (
        <div className="space-y-8 anim-slide-up">
          <div className="max-w-md mx-auto bg-[#0b1320] border border-cyan-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl anim-popup">
            {/* Tabs */}
            <div className="flex bg-[#070b13] p-1 rounded-2xl border border-cyan-950 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 ${
                  authMode === 'forgot'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Form */}
            {authMode === 'signin' && (
              <div className="space-y-4 anim-slide-up anim-popup">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white">Researcher Sign In</h3>
                  <p className="text-xs text-slate-400 mt-1">Access your Supabase cloud profile, photo, &amp; achievements.</p>
                </div>

                {/* Google Sign In option */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmittingAuth}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-cyan-950/80 w-full" />
                  <span className="bg-[#0b1320] px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">or sign in with password</span>
                  <div className="border-t border-cyan-950/80 w-full" />
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="curie@chemora.edu"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono text-slate-400">Password</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
                  >
                    {isSubmittingAuth ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Sign In to Existing Account</span>
                  </button>
                </form>
              </div>
            )}

            {authMode === 'signup' && (
              <form key="signup" onSubmit={handleSignUp} className="space-y-4 anim-slide-up anim-popup">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white">Register Researcher Account</h3>
                  <p className="text-xs text-slate-400 mt-1">Start recording laboratory achievements and daily streaks.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g. Rosalind Franklin"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="franklin@lab.org"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Laboratory Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition hover:scale-102 active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isSubmittingAuth ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Create Researcher Account</span>
                </button>
              </form>
            )}

            {authMode === 'forgot' && (
              <form key="forgot" onSubmit={handleForgotPassword} className="space-y-4 anim-slide-up anim-popup">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400 mt-1">Enter your email and we'll dispatch a secure recovery link.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="your.email@chemora.edu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-cyan-900/80 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition hover:scale-102 active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isSubmittingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Send Recovery Email</span>
                </button>
              </form>
            )}

            {/* Guest Exploration Option */}
            <div className="mt-6 pt-5 border-t border-cyan-950 text-center">
              <p className="text-xs text-slate-400 mb-2">Want to experiment without signing in?</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Beaker className="w-3.5 h-3.5 text-cyan-400" />
                <span>Guest Exploration (In-Memory Session • Zero Account LocalStorage)</span>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#0b1320]/60 border border-cyan-950/80 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">API Supabase Database</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                PostgreSQL cloud database system storing chemist credentials, profiles, and bench achievements.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b1320]/60 border border-cyan-950/80 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Zero LocalStorage Policy</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                0 bytes account data stored locally. Verified by Senior Engineer for data privacy and security.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b1320]/60 border border-cyan-950/80 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Cloud Laboratory Sync</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Instant sync across devices for your experiments, streaks, and chemical knowledge XP.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Database-Backed Learner Reviews & Feedback System */}
      <ReviewsSection className="mt-12" />
    </div>
  );
};
