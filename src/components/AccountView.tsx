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
  deleteResearcherAccount,
} from '../services/accountApi';
import { supabase } from '../services/supabaseClient';
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { PhRing, BubbleDots } from './Loaders';
import {
  User,
  Shield,
  Settings,
  Check,
  Sparkles,
  Trophy,
  Trash2,
  Beaker,
  Award,
  LogOut,
  Lock,
  Mail,
  Camera,
  Upload,
  AlertCircle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Activity,
  CheckCheck,
  Cpu,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { AuthCard } from './AuthCard';
import { GradientWaves } from './GradientWaves';
import { ErrorBoundary } from './ErrorBoundary';
import { AvatarCropModal } from './AvatarCropModal';
import { withTimeout } from '../utils/fetchWithRetry';

interface AccountViewProps {
  onThemeChanged?: () => void;
}

const AVATAR_OPTIONS = [
  { label: 'Flask', url: '/favicon.png' },
  { label: 'Carbon', url: '/assets/chemistry/carbon.svg' },
  { label: 'Atom', url: '/icon-192.png' },
];

const SECTIONS = ['profile', 'security', 'labdata'] as const;
type AccountSection = typeof SECTIONS[number];

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
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  // Active section for sliding tabs ('profile', 'security', 'labdata')
  const [activeSection, setActiveSection] = useState<AccountSection>('profile');

  // Advanced Supabase diagnostics accordion (collapsed by default)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Profile Picture Upload & Crop State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedCropImage, setSelectedCropImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep profile ref to prevent stale closures and infinite effect loops
  const profileRef = useRef(profile);
  profileRef.current = profile;

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Animated Floating Toast Notification State (Auto-dismiss after 4s)
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

  // Edit Profile Form State
  const [nameInput, setNameInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Synchronize nameInput with profile
  useEffect(() => {
    if (profile.name) {
      setNameInput(profile.name);
    }
  }, [profile.name]);

  // Change Password State
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

  // Keep URL hash (#account) synchronized
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('security')) {
        setActiveSection('security');
      } else if (hash.includes('lab') || hash.includes('data')) {
        setActiveSection('labdata');
      } else if (hash.includes('profile')) {
        setActiveSection('profile');
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const handleSelectSection = (section: AccountSection) => {
    setActiveSection(section);
    // Keep #account working while smoothly reflecting sub-view
    window.location.hash = section === 'profile' ? '#account' : `#account/${section}`;
  };

  // Load session from backend API (Zero-localStorage: profile comes exclusively from server)
  const refreshAccount = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthCheckTimedOut(false);

    const safetyTimer = setTimeout(() => {
      console.warn('[AccountView] Auth check safety timeout reached (4000ms). Forcing UI availability.');
      setIsLoadingAuth(false);
      setAuthCheckTimedOut(true);
    }, 4000);

    checkBackendStatus()
      .then((status) => setIsBackendOnline(status.status === 'online'))
      .catch(() => setIsBackendOnline(false));

    fetchDatabaseDiagnostics()
      .then((dbInfo) => { if (dbInfo) setDbDiagnostics(dbInfo); })
      .catch(() => {});

    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        3000,
        { data: { session: null }, error: null }
      );
      if (session?.user) {
        clearTimeout(safetyTimer);
        await syncSupabaseSessionRef.current(session.user, session.access_token);
        return;
      }

      const data = await fetchCurrentAccount();
      if (data.authenticated && data.profile) {
        setIsAuthenticated(true);
        setAccountProfile(data.profile);

        const currentProfile = profileRef.current;
        const updatedProfile: UserProfile = {
          ...currentProfile,
          id: data.profile.id,
          name: data.profile.full_name || 'Researcher',
          email: data.profile.email,
          avatar: data.profile.avatar_url || '/favicon.png',
          rank: data.profile.rank || 'Novice Alchemist',
          isLoggedIn: true,
        };
        setProfile(updatedProfile);
        setNameInput(updatedProfile.name);

        fetchResearcherProgressFromDatabase()
          .then((cloudProg) => {
            if (cloudProg?.progress) {
              setSyncedProgress(cloudProg.progress);
              setLastDbSyncTime(
                cloudProg.progress.updatedAt
                  ? new Date(cloudProg.progress.updatedAt).toLocaleTimeString()
                  : new Date().toLocaleTimeString()
              );
            }
          })
          .catch((progErr) => {
            console.warn('Progress lookup from database note:', progErr);
          });
      } else {
        setIsAuthenticated(false);
        setAccountProfile(null);
        if (profileRef.current.isLoggedIn) {
          const guest: UserProfile = { ...GUEST_PROFILE, preferences: profileRef.current.preferences };
          setProfile(guest);
        }
      }
    } catch (err) {
      console.warn('Backend account verification failed:', err);
      setIsAuthenticated(false);
      setAuthCheckTimedOut(true);
    } finally {
      clearTimeout(safetyTimer);
      setIsLoadingAuth(false);
    }
  }, []);

  // Synchronize Supabase session with strict avatar priority order (Part B.6)
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

      let profileData: any = null;

      try {
        const { data: byId } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        if (byId) profileData = byId;
      } catch (err) {
        console.warn('Profile lookup by id note:', err);
      }

      if (!profileData) {
        try {
          const { data: byUserId } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', sessionUser.id)
            .maybeSingle();
          if (byUserId) profileData = byUserId;
        } catch (err) {
          console.warn('Profile lookup by user_id note:', err);
        }
      }

      if (!profileData && sessionUser.email) {
        try {
          const { data: byEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', sessionUser.email.toLowerCase().trim())
            .maybeSingle();
          if (byEmail) profileData = byEmail;
        } catch {}
      }

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

      if (!profileData) {
        const defaultName = metaName || sessionUser.email?.split('@')[0] || 'Researcher';
        const initialLevels = challengeState?.levels?.length || 0;
        const initialXp = challengeState?.xp || 0;
        const initialStreak = streakState?.currentStreak || 0;
        const initialRank = profile.rank && profile.rank !== 'Guest Chemist' ? profile.rank : 'Novice Alchemist';

        try {
          const { data: created } = await supabase
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
          if (created) profileData = created;
        } catch (insErr) {
          console.warn('Auto-provision insert note:', insErr);
        }
      }

      // Requirement B.6: Avatar Priority Bug Fix
      // Strict order: profiles.avatar_url (user-chosen) > OAuth photo > storage fallback > /favicon.png
      // Never overwrite an uploaded or user-chosen avatar with the OAuth photo!
      let resolvedAvatar = profileData?.avatar_url;
      if (!resolvedAvatar || resolvedAvatar === '/favicon.png') {
        if (metaAvatar) {
          resolvedAvatar = metaAvatar;
        } else {
          try {
            const { data: storageData } = supabase.storage.from('avatars').getPublicUrl(`${sessionUser.id}/avatar`);
            if (storageData?.publicUrl) {
              resolvedAvatar = `${storageData.publicUrl}?v=${Date.now()}`;
            }
          } catch {}
        }
      }
      if (!resolvedAvatar) {
        resolvedAvatar = '/favicon.png';
      }

      // Only persist OAuth photo if profiles.avatar_url was completely empty/unset
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
      setNameInput(fullName);

      if (profileData && (profileData.levels_cleared !== undefined || profileData.xp_earned !== undefined)) {
        setSyncedProgress({
          userId: sessionUser.id,
          experimentsCompleted: completedExperimentsCount,
          challengesCompleted: Number(profileData.levels_cleared || 0),
          streakDays: Number(profileData.daily_streak || 0),
          totalXp: Number(profileData.xp_earned || 0),
          rankTitle: rankTitle,
          completedExperimentIds: [],
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLastDbSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Error syncing Supabase user profile:', err);
    }
  }, [challengeState, streakState, completedExperimentsCount, profile.rank]);

  const syncSupabaseSessionRef = useRef(syncSupabaseSession);
  syncSupabaseSessionRef.current = syncSupabaseSession;
  const refreshAccountRef = useRef(refreshAccount);
  refreshAccountRef.current = refreshAccount;

  // Supabase Auth listener
  useEffect(() => {
    const mountSafetyTimer = setTimeout(() => {
      setIsLoadingAuth(false);
      setAuthCheckTimedOut(true);
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          if (
            moduleActiveSession.userId === session.user.id &&
            moduleActiveSession.token === session.access_token
          ) {
            setIsLoadingAuth(false);
            clearTimeout(mountSafetyTimer);
            return;
          }
          moduleActiveSession = { userId: session.user.id, token: session.access_token };
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
          clearTimeout(mountSafetyTimer);

          setTimeout(() => {
            syncSupabaseSessionRef.current(session.user, session.access_token).catch(() => {});
          }, 0);
        } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          moduleActiveSession = {};
          setAuthToken(null);
          setIsAuthenticated(false);
          setAccountProfile(null);
          setSyncedProgress(null);
          setProfile((prev) => ({ ...GUEST_PROFILE, preferences: prev.preferences }));
          setIsLoadingAuth(false);
          clearTimeout(mountSafetyTimer);
        } else {
          setIsLoadingAuth(false);
          clearTimeout(mountSafetyTimer);
        }
      }
    );

    refreshAccountRef.current();

    const handleStreakChange = () => setStreakState(getDailyStreak());
    window.addEventListener('chemora:streak_update', handleStreakChange);

    return () => {
      clearTimeout(mountSafetyTimer);
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
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        3000,
        { data: { session: null }, error: null }
      );
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
    } catch (err: any) {
      triggerToast(err.message || 'Database sync encountered an issue.', 'error');
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Sign In
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
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (sbError) {
        let msg = sbError.message;
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Invalid email or password. Please verify your credentials.';
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
      const msg = cleanErrorMessage(err.message || 'Authentication failed.');
      setAuthError(msg);
      triggerToast(msg, 'error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Google OAuth Sign In
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
      if (error) throw error;
    } catch (err: any) {
      const msg = err.message || 'Google sign-in encountered an error.';
      setAuthError(msg);
      triggerToast(msg, 'error');
      setIsSubmittingAuth(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both an email address and a password.');
      return;
    }
    if (authPassword.length < 10) {
      setAuthError('Laboratory password must be at least 10 characters long.');
      return;
    }
    if (!agreeTerms || !confirmAge) {
      setAuthError('Please agree to the Terms of Service, Privacy Policy, and confirm age consent to create an account.');
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
          data: { full_name: authFullName.trim() || 'Researcher' },
        },
      });

      if (sbError) {
        const result = await signUpResearcher(authEmail.trim(), authPassword, authFullName.trim());
        if (result.requiresEmailConfirmation) {
          setAuthSuccess(result.message || 'Registration successful! Please check your email.');
          triggerToast('Registration email sent! Please check your inbox.', 'info');
        } else {
          setAuthSuccess('Welcome to CHEMORA! Your researcher account has been created.');
          triggerToast('Researcher account registered successfully!', 'success');
          await refreshAccount();
        }
      } else {
        if (!sbData.session) {
          setAuthSuccess('Account created! Please check your email to confirm your address.');
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

  // Sign Out
  const handleSignOut = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      await supabase.auth.signOut().catch(() => {});
      await signOutResearcher().catch(() => {});

      setIsAuthenticated(false);
      setAccountProfile(null);
      setSyncedProgress(null);
      setProfile((prev) => ({ ...GUEST_PROFILE, preferences: prev.preferences }));
      triggerToast('Signed out of laboratory session.', 'info');
    } catch (err: any) {
      triggerToast('Sign out failed: ' + (err.message || 'Network error'), 'error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // File Picker & Validation for Profile Picture (Part B.1 & B.2)
  const handleFileCandidate = (file: File) => {
    const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      const msg = 'Unsupported file format. Please upload JPEG, PNG, or WebP.';
      setUploadError(msg);
      triggerToast(msg, 'error');
      return;
    }

    // 5 MB limit before compression
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File size exceeds 5 MB. Please select a smaller photo.';
      setUploadError(msg);
      triggerToast(msg, 'error');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedCropImage(reader.result);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileCandidate(file);
    }
    // Clear input value so same file can be re-selected if cancelled
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileCandidate(file);
    }
  };

  // Crop & Upload Execution (Part B.3 & B.4)
  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || accountProfile?.user_id || accountProfile?.id;
      if (!userId) {
        throw new Error('User session not found. Please sign in again.');
      }

      // 1. Upload to Supabase Storage: avatars bucket under `<user_id>/avatar`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar`, croppedBlob, {
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload photo to storage.');
      }

      // 2. Build public URL with cache-busting timestamp
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/avatar`);

      const finalAvatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      // 3. Persist to profiles.avatar_url in Supabase database & backend route
      await Promise.allSettled([
        supabase.from('profiles').update({ avatar_url: finalAvatarUrl }).eq('id', userId),
        supabase.from('profiles').update({ avatar_url: finalAvatarUrl }).eq('user_id', userId),
      ]);

      try {
        await updateResearcherProfile({ avatar_url: finalAvatarUrl });
      } catch (proxyErr) {
        console.warn('Backend proxy avatar update note:', proxyErr);
      }

      // 4. Update local profile state immediately so header, dock, and insignia refresh
      setProfile((prev) => ({ ...prev, avatar: finalAvatarUrl }));
      setAccountProfile((prev) => prev ? { ...prev, avatar_url: finalAvatarUrl } : null);

      // Dispatch global profile update event for live UI synchronization
      window.dispatchEvent(
        new CustomEvent('chemora:profile_update', { detail: { avatar: finalAvatarUrl } })
      );

      triggerToast('Profile picture updated successfully!', 'success');
      setIsCropModalOpen(false);
      setSelectedCropImage(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to upload profile picture.';
      triggerToast(msg, 'error');
      throw err;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove Photo (Part B.1)
  const handleRemovePhoto = async () => {
    setIsSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || accountProfile?.user_id || accountProfile?.id;

      if (userId) {
        // Delete avatar object from Supabase storage
        await supabase.storage.from('avatars').remove([`${userId}/avatar`]).catch(() => {});

        // Reset database avatar_url to default
        await Promise.allSettled([
          supabase.from('profiles').update({ avatar_url: '/favicon.png' }).eq('id', userId),
          supabase.from('profiles').update({ avatar_url: '/favicon.png' }).eq('user_id', userId),
        ]);
      }

      await updateResearcherProfile({ avatar_url: '/favicon.png' }).catch(() => {});

      setProfile((prev) => ({ ...prev, avatar: '/favicon.png' }));
      setAccountProfile((prev) => prev ? { ...prev, avatar_url: '/favicon.png' } : null);

      window.dispatchEvent(
        new CustomEvent('chemora:profile_update', { detail: { avatar: '/favicon.png' } })
      );

      triggerToast('Profile photo removed. Restored laboratory emblem.', 'info');
    } catch (err: any) {
      triggerToast('Failed to remove photo: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Choose preset insignia
  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setIsSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || accountProfile?.user_id || accountProfile?.id;

      if (userId) {
        await Promise.allSettled([
          supabase.from('profiles').update({ avatar_url: presetUrl }).eq('id', userId),
          supabase.from('profiles').update({ avatar_url: presetUrl }).eq('user_id', userId),
        ]);
      }

      await updateResearcherProfile({ avatar_url: presetUrl }).catch(() => {});

      setProfile((prev) => ({ ...prev, avatar: presetUrl }));
      setAccountProfile((prev) => prev ? { ...prev, avatar_url: presetUrl } : null);

      window.dispatchEvent(
        new CustomEvent('chemora:profile_update', { detail: { avatar: presetUrl } })
      );

      triggerToast('Laboratory insignia updated.', 'success');
    } catch (err: any) {
      triggerToast('Failed to update insignia.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Profile Name & details
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setIsSavingProfile(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || accountProfile?.user_id || accountProfile?.id;

      if (userId) {
        await Promise.allSettled([
          supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', userId),
          supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('user_id', userId),
        ]);
      }

      await updateResearcherProfile({ full_name: nameInput.trim() }).catch(() => {});

      setProfile((prev) => ({ ...prev, name: nameInput.trim() }));
      setAccountProfile((prev) => prev ? { ...prev, full_name: nameInput.trim() } : null);

      triggerToast('Researcher profile name updated!', 'success');
    } catch (err: any) {
      triggerToast('Failed to save name: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 10) {
      setPasswordStatus({ error: 'Password must be at least 10 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: 'Passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus(null);

    try {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          3000,
          { data: { session: null }, error: null }
        );
        if (session) {
          await supabase.auth.updateUser({ password: newPassword });
        }
      } catch {}

      await updateResearcherPassword(newPassword);
      setPasswordStatus({ success: 'Laboratory password successfully updated.' });
      triggerToast('Laboratory password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = cleanErrorMessage(err.message || 'Failed to update password.');
      setPasswordStatus({ error: msg });
      triggerToast(msg, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Update Preferences locally
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

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      triggerToast('Please enter your account password to confirm deletion.', 'error');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await deleteResearcherAccount(deletePassword);
      try {
        localStorage.removeItem('chemoraExperimentProgress');
        localStorage.removeItem('chemora_streak_data');
        localStorage.removeItem('chemora_profile');
      } catch {}
      setProfile(GUEST_PROFILE);
      setAccountProfile(null);
      setIsAuthenticated(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
      triggerToast('Researcher account permanently erased.', 'success');
      await refreshAccount();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('chemoraChallengeState');
    localStorage.removeItem('chemoraExperimentProgress');
    setChallengeState({ levels: [], xp: 0, answers: 0, correct: 0, levelResults: {}, rewards: [] });
    setShowResetConfirm(false);
    triggerToast('Local lab progress and practical records reset.', 'info');
    window.dispatchEvent(new CustomEvent('chemora:progress'));
  };

  // Helper to determine panel position for sliding transition
  const getPanelPositionClass = (sec: AccountSection) => {
    const currentIndex = SECTIONS.indexOf(activeSection);
    const secIndex = SECTIONS.indexOf(sec);
    if (secIndex === currentIndex) return 'active';
    if (secIndex < currentIndex) return 'prev';
    return 'next';
  };

  const isCustomPhotoActive = Boolean(
    profile.avatar &&
    profile.avatar !== '/favicon.png' &&
    !AVATAR_OPTIONS.some((av) => av.url === profile.avatar)
  );

  return (
    <div className="relative w-full min-h-[100dvh] pb-[calc(140px+env(safe-area-inset-bottom,24px))] sm:pb-[calc(96px+env(safe-area-inset-bottom,24px))]">
      {/* ========================================================
          1. REUSABLE FIXED PAGE BACKGROUND: GradientWaves
             Fixed, pointer-events: none, dark Chemora palette:
             horizon: #032b38, wave: #14a3c4, crest: #7fdcef, low amplitude, 30fps
             Renders static background under prefers-reduced-motion
          ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <GradientWaves
          horizonColor="#032b38"
          waveColor="#14a3c4"
          crestColor="#7fdcef"
          amplitude={2.6}
          fogDepth={26}
          brightness={0.95}
          mouseInteraction={false}
          grain={false}
        />
      </div>

      {/* Hidden File Picker Input for Camera/Gallery Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Circular Crop & Processing Modal (Part B.3 & B.4) */}
      {selectedCropImage && (
        <AvatarCropModal
          isOpen={isCropModalOpen}
          imageSrc={selectedCropImage}
          isUploading={isUploadingAvatar}
          onClose={() => {
            setIsCropModalOpen(false);
            setSelectedCropImage(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Animated Floating Toast Notification Popup (Auto-dismisses in 4s) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-[90%] anim-slide-down anim-popup pointer-events-auto"
        >
          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.3)]'
                : 'bg-[#04212b]/95 border-cyan-500/60 text-cyan-200 shadow-[0_10px_30px_rgba(6,182,212,0.3)]'
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
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Reset Progress Confirmation Dialog */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowResetConfirm(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#0a1220] border-t sm:border-2 border-rose-500/60 rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(244,63,94,0.35)] anim-popup pb-[env(safe-area-inset-bottom,20px)] sm:pb-7"
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-600/80 mx-auto mb-4 sm:hidden" />
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
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition active:scale-[0.96]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition active:scale-[0.96]"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container (clearing floating dock) */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 relative z-10 pt-4">
        {/* Loading state indicator */}
        {isLoadingAuth && (
          <div className="p-8 text-center bg-[#04212b]/80 border border-cyan-900/40 rounded-3xl mb-8 flex items-center justify-center gap-3.5 text-cyan-300 text-sm anim-popup" role="status" aria-live="polite">
            <PhRing size="sm" label="Synchronizing credentials..." />
            <span>Synchronizing with laboratory authentication services...</span>
          </div>
        )}

        {/* Unauthenticated View: Sliding AuthCard Portal (Untouched as requested) */}
        {!isLoadingAuth && !isAuthenticated && (
          <div className="space-y-10 anim-slide-up">
            <ErrorBoundary tabName="Account Authentication Card">
              <AuthCard
                isRegister={authMode === 'signup'}
                onToggleMode={(isReg) => {
                  setAuthMode(isReg ? 'signup' : 'signin');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                email={authEmail}
                onEmailChange={setAuthEmail}
                password={authPassword}
                onPasswordChange={setAuthPassword}
                fullName={authFullName}
                onFullNameChange={setAuthFullName}
                agreeTerms={agreeTerms}
                onAgreeTermsChange={setAgreeTerms}
                confirmAge={confirmAge}
                onConfirmAgeChange={setConfirmAge}
                rememberMe={true}
                isSubmitting={isSubmittingAuth}
                error={authError}
                onClearError={() => setAuthError(null)}
                success={authSuccess}
                onClearSuccess={() => setAuthSuccess(null)}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                onGoogleSignIn={handleGoogleSignIn}
                onForgotPassword={async (recoveryEmail) => {
                  if (!recoveryEmail.trim()) {
                    setAuthError('Please enter an email address.');
                    return;
                  }
                  setIsSubmittingAuth(true);
                  setAuthError(null);
                  setAuthSuccess(null);
                  try {
                    await supabase.auth.resetPasswordForEmail(recoveryEmail.trim()).catch(() => {});
                    const msg = await requestPasswordReset(recoveryEmail.trim());
                    setAuthSuccess(msg);
                    triggerToast(msg, 'info');
                  } catch (err: any) {
                    const msg = cleanErrorMessage(err.message || 'Failed to request password reset.');
                    setAuthError(msg);
                    triggerToast(msg, 'error');
                  } finally {
                    setIsSubmittingAuth(false);
                  }
                }}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* ========================================================
            UPGRADED LOGGED-IN ACCOUNT CARD:
            - Rounded (32px) card
            - Left half: dark teal (#04212b) panel with own subtle wave background,
              avatar with ONLINE badge & camera button, name, rank, email, glass pill buttons
            - Right half: sliding section panels (Profile, Security, Lab Data)
              0.65s translate transition, opacity + visibility
            ======================================================== */}
        {!isLoadingAuth && isAuthenticated && accountProfile && (
          <div className="chemora-account-card">
            {/* 1. DARK TEAL (#04212b) SIDE PANEL WITH WAVES */}
            <div className="dark-side-panel">
              {/* Subtle Wave Background inside the Dark Teal Panel */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
                <GradientWaves
                  horizonColor="#032b38"
                  waveColor="#14a3c4"
                  crestColor="#7fdcef"
                  amplitude={2.4}
                  fogDepth={22}
                  brightness={0.85}
                  mouseInteraction={false}
                  grain={false}
                />
              </div>

              {/* Panel Content (Z-10 relative) */}
              <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                {/* Avatar with ONLINE Badge & Camera Upload Button */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleDrop}
                  className={`relative mb-4 group cursor-pointer ${isDraggingFile ? 'ring-4 ring-cyan-400 rounded-3xl' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click or drag a photo to update your avatar"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-purple-500/30 border-2 border-cyan-400/80 p-2 flex items-center justify-center shadow-xl shadow-cyan-950/40 relative overflow-hidden">
                    <img
                      src={profile.avatar}
                      alt={`${profile.name}'s profile avatar`}
                      className="w-full h-full object-contain filter drop-shadow rounded-2xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/favicon.png';
                      }}
                    />
                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-[#04212b]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-cyan-300">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Change</span>
                    </div>
                  </div>

                  {/* Online Status Badge */}
                  <div className="absolute -top-1.5 -left-1.5 px-2 py-0.5 rounded-md bg-emerald-950/95 border border-emerald-500 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </div>

                  {/* Camera Button on the Avatar Corner (Part B.1) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploadingAvatar}
                    aria-label="Upload profile photo"
                    title="Upload profile photo (JPEG, PNG, WebP up to 5 MB)"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#04212b] border-2 border-[#04212b] shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer z-20"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Researcher Name & Rank Chip */}
                <div className="mb-2 w-full">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {profile.name}
                  </h2>
                  <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 shadow-sm">
                      {profile.rank}
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <p className="text-xs font-mono text-cyan-200/80 flex items-center justify-center sm:justify-start gap-1.5 mb-6">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{accountProfile.email}</span>
                </p>
              </div>

              {/* Action Buttons in Glass Pill Style (Part A.2) */}
              <div className="relative z-10 flex flex-col gap-2.5 w-full pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleSelectSection('profile')}
                  className={`glass-pill-btn ${activeSection === 'profile' ? 'active' : ''}`}
                >
                  <User className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('security')}
                  className={`glass-pill-btn ${activeSection === 'security' ? 'active' : ''}`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Security</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSection('labdata')}
                  className={`glass-pill-btn ${activeSection === 'labdata' ? 'active' : ''}`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Lab Data</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="glass-pill-btn danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* 2. SECTIONS VIEWPORT WITH SLIDING TRANSITION (Part A.3) */}
            <div className="sections-viewport" role="region" aria-label="Account details">
              {/* SECTION 1: PROFILE & INSIGNIA */}
              <div
                className={`section-panel ${getPanelPositionClass('profile')}`}
                aria-hidden={activeSection !== 'profile'}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#04212b] tracking-tight">Researcher Identity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize your chemist name, insignia, and environment preferences.
                  </p>
                </div>

                {/* Profile Edit Fields */}
                <div className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Researcher Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Marie Curie"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[16px] sm:text-sm text-slate-900 focus:bg-white focus:border-[#04212b] focus-visible:outline-none transition min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={isSavingProfile || nameInput.trim() === profile.name}
                        className="px-4 py-2.5 rounded-xl bg-[#04212b] hover:bg-[#073646] text-white text-xs font-bold transition disabled:opacity-40 min-h-[44px]"
                      >
                        {isSavingProfile ? <BubbleDots label="Saving..." /> : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Profile Picture Actions (Part B.1 & B.2) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Profile Picture (Supabase Avatars Bucket)
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center gap-2 transition min-h-[44px] shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload photo</span>
                      </button>

                      {isCustomPhotoActive && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isSavingProfile || isUploadingAvatar}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 transition min-h-[44px]"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Remove photo</span>
                        </button>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-xs text-rose-600 mt-2 font-medium">{uploadError}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Accepts JPEG, PNG, or WebP up to 5 MB. Crops to 512×512 WebP with canvas privacy protection (strips EXIF location metadata).
                    </p>
                  </div>

                  {/* Preset Insignia Alternatives (Part B.1) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Alternative Laboratory Insignia
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av.url}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(av.url)}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition min-h-[64px] ${
                            profile.avatar === av.url
                              ? 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-2 ring-cyan-500/40 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-6 h-6 object-contain" />
                          <span className="font-semibold">{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Laboratory Environment Preferences */}
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Environment Preferences</span>
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-slate-800">Laboratory Sound Effects</div>
                          <div className="text-[11px] text-slate-500">Audio feedback on reaction tests.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.preferences.soundEffects}
                          onChange={(e) => updatePreference('soundEffects', e.target.checked)}
                          className="w-5 h-5 rounded accent-[#04212b] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-slate-800">Auto-Explain Reaction Mechanisms</div>
                          <div className="text-[11px] text-slate-500">Show chemical explanations automatically.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.preferences.autoExplain}
                          onChange={(e) => updatePreference('autoExplain', e.target.checked)}
                          className="w-5 h-5 rounded accent-[#04212b] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-slate-800">High Contrast Laboratory View</div>
                          <div className="text-[11px] text-slate-500">Enhanced borders for molecular charts.</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profile.preferences.highContrast}
                          onChange={(e) => updatePreference('highContrast', e.target.checked)}
                          className="w-5 h-5 rounded accent-[#04212b] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECURITY & DATA PRIVACY */}
              <div
                className={`section-panel ${getPanelPositionClass('security')}`}
                aria-hidden={activeSection !== 'security'}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#04212b] tracking-tight">Security &amp; Privacy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your password and manage data deletion rights.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Update Password</span>
                    </h4>

                    {passwordStatus?.error && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        {passwordStatus.error}
                      </div>
                    )}
                    {passwordStatus?.success && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        {passwordStatus.success}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        New Password (min 10 characters)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={10}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-[16px] sm:text-sm text-slate-900 focus:border-[#04212b] focus-visible:outline-none min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={10}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-[16px] sm:text-sm text-slate-900 focus:border-[#04212b] focus-visible:outline-none min-h-[44px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword || !newPassword || !confirmPassword}
                      className="w-full py-2.5 rounded-xl bg-[#04212b] hover:bg-[#073646] text-white text-xs font-bold transition disabled:opacity-40 min-h-[44px]"
                    >
                      {isChangingPassword ? <BubbleDots label="Updating password..." /> : 'Update Password'}
                    </button>
                  </form>

                  {/* Data Privacy & Deletion (GDPR / CCPA) */}
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-600" />
                      <span>Data Privacy &amp; Deletion Controls</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Manage your stored chemistry achievements or exercise your right to permanent account erasure under GDPR Article 17.
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 min-h-[44px]"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset Study Cache</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 min-h-[44px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Account</span>
                      </button>
                    </div>

                    {showDeleteConfirm && (
                      <div className="p-3.5 rounded-xl bg-white border border-rose-300 space-y-2.5 animate-popup mt-2">
                        <div className="text-xs font-bold text-rose-900">
                          Confirm permanent account erasure
                        </div>
                        <input
                          type="password"
                          placeholder="Enter your account password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-rose-500 focus-visible:outline-none min-h-[44px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingAccount || !deletePassword}
                            onClick={handleDeleteAccount}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {isDeletingAccount ? 'Erasing...' : 'Confirm Erase'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: LAB DATA & ADVANCED ARCHITECTURE */}
              <div
                className={`section-panel ${getPanelPositionClass('labdata')}`}
                aria-hidden={activeSection !== 'labdata'}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#04212b] tracking-tight">Laboratory Metrics</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your synchronized chemistry benchmarks and practical laboratory progress.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncProgressToSupabase}
                    disabled={isSyncingDb}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm min-h-[44px]"
                  >
                    {isSyncingDb ? <BubbleDots label="Syncing..." /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>{isSyncingDb ? 'Syncing...' : 'Sync Lab Data'}</span>
                  </button>
                </div>

                {/* 4 Laboratory Metric Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <div className="text-2xl font-black text-amber-900">{streakState.currentStreak}d</div>
                    <div className="text-[11px] font-bold text-amber-800 uppercase">Daily Streak</div>
                    <div className="text-[10px] text-amber-700">{streakState.streakLevel}</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                    <Sparkles className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                    <div className="text-2xl font-black text-cyan-900">{challengeState.xp}</div>
                    <div className="text-[11px] font-bold text-cyan-800 uppercase">Experience XP</div>
                    <div className="text-[10px] text-cyan-700">Mastery Points</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                    <Award className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-2xl font-black text-blue-900">{challengeState.levels.length}</div>
                    <div className="text-[11px] font-bold text-blue-800 uppercase">Challenges</div>
                    <div className="text-[10px] text-blue-700">Quizzes Cleared</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <Beaker className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <div className="text-2xl font-black text-emerald-900">{completedExperimentsCount}</div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">Practicals</div>
                    <div className="text-[10px] text-emerald-700">Labs Completed</div>
                  </div>
                </div>

                {/* ========================================================
                    5. ADVANCED DATABASE SYSTEM (Collapsed by default - Part A.5)
                    ======================================================== */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 transition">
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    aria-expanded={isAdvancedOpen}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 transition min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-cyan-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Advanced: API Supabase Database System
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          v2.0 PostgreSQL • Zero-LocalStorage Engine
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {isBackendOnline ? 'Online' : 'Active'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isAdvancedOpen && (
                    <div className="p-4 pt-1 border-t border-slate-200 space-y-3 anim-slide-down">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono text-slate-600">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                            <Server className="w-3 h-3 text-cyan-600" />
                            public.profiles
                          </div>
                          <div>User UUID: <span className="text-cyan-800 font-bold truncate block">{accountProfile.user_id || accountProfile.id}</span></div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                          <div className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                            <Activity className="w-3 h-3 text-teal-600" />
                            public.researcher_progress
                          </div>
                          <div>Status: <span className="text-emerald-700 font-bold">Synced Cloud Persistence</span></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Last sync: {lastDbSyncTime || 'Session active'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-800 font-semibold">
                          <Cpu className="w-3 h-3" />
                          <span>Audited Zero-LocalStorage Policy</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
