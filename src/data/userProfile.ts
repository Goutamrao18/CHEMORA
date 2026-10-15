export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  rank: string;
  isLoggedIn: boolean;
  preferences: {
    theme: 'dark' | 'light';
    soundEffects: boolean;
    highContrast: boolean;
    autoExplain: boolean;
  };
}

const PROFILE_KEY = 'chemora_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'CH-8492',
  name: 'Alex Rivera',
  email: 'alex.rivera@chemora.edu',
  avatar: '/assets/chemistry/carbon.svg',
  rank: 'Chemistry Explorer',
  isLoggedIn: true,
  preferences: {
    theme: 'dark',
    soundEffects: true,
    highContrast: false,
    autoExplain: true,
  },
};

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}
