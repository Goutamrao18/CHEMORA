export interface UserPreferences {
  theme: 'dark' | 'light';
  soundEffects: boolean;
  highContrast: boolean;
  autoExplain: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  rank: string;
  isLoggedIn: boolean;
  preferences: UserPreferences;
}

const UI_PREFERENCES_KEY = 'chemora_ui_preferences';

export const GUEST_PROFILE: UserProfile = {
  id: '',
  name: 'Guest Chemist',
  email: '',
  avatar: '/favicon.png',
  rank: 'Apprentice Chemist',
  isLoggedIn: false,
  preferences: {
    theme: 'dark',
    soundEffects: true,
    highContrast: false,
    autoExplain: true,
  },
};

/**
 * Actively purge any legacy account data from localStorage to ensure
 * strict zero-localStorage policy for researcher accounts.
 */
function purgeLegacyAccountFromLocalStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('chemora_user_profile');
      window.localStorage.removeItem('chemora_account');
    }
  } catch {
    // Ignore storage restrictions
  }
}

// Run purge on module load
purgeLegacyAccountFromLocalStorage();

export function getStoredUiPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) return GUEST_PROFILE.preferences;
    const parsed = JSON.parse(raw);
    return {
      theme: 'dark',
      soundEffects: parsed.soundEffects ?? true,
      highContrast: Boolean(parsed.highContrast),
      autoExplain: parsed.autoExplain ?? true,
    };
  } catch {
    return GUEST_PROFILE.preferences;
  }
}

export function saveStoredUiPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Returns clean in-memory profile state with local UI theme preferences.
 * Account data is NEVER stored in or loaded from localStorage.
 */
export function getStoredProfile(): UserProfile {
  purgeLegacyAccountFromLocalStorage();
  return {
    ...GUEST_PROFILE,
    preferences: getStoredUiPreferences(),
  };
}

/**
 * Zero-localStorage implementation:
 * Account identity (name, email, avatar, rank, login credentials) is NOT saved to localStorage.
 * Only non-sensitive UI display settings (theme/sound) are preserved.
 */
export function saveStoredProfile(profile: UserProfile): void {
  // Purge any accidental account profile key
  purgeLegacyAccountFromLocalStorage();
  if (profile.preferences) {
    saveStoredUiPreferences(profile.preferences);
  }
}
