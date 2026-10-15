export interface DailyStreakState {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  activeDates: string[]; // List of "YYYY-MM-DD"
  freezesRemaining: number;
  streakLevel: string;
  hasCompletedToday: boolean;
}

const STREAK_STORAGE_KEY = 'chemora_daily_streak';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStreakLevel(streak: number): string {
  if (streak >= 30) return 'Legendary Plasma';
  if (streak >= 14) return 'Inferno Chemist';
  if (streak >= 7) return 'Blazing Scholar';
  if (streak >= 3) return 'Steady Flame';
  if (streak >= 1) return 'Spark Ignition';
  return 'Unlit Flame';
}

const DEFAULT_STREAK: DailyStreakState = {
  currentStreak: 3, // Starter momentum
  bestStreak: 5,
  lastActiveDate: getYesterdayString(),
  activeDates: [getYesterdayString()],
  freezesRemaining: 2,
  streakLevel: 'Steady Flame',
  hasCompletedToday: false,
};

export function getDailyStreak(): DailyStreakState {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (!raw) {
      // First time initialization with yesterday as active for pleasant onboarding
      saveDailyStreak(DEFAULT_STREAK);
      return DEFAULT_STREAK;
    }

    const parsed = JSON.parse(raw) as DailyStreakState;
    const hasCompletedToday = parsed.activeDates?.includes(today) || parsed.lastActiveDate === today;

    // Check if streak was broken (last activity older than yesterday and not today)
    let currentStreak = parsed.currentStreak || 0;
    if (parsed.lastActiveDate && parsed.lastActiveDate !== today && parsed.lastActiveDate !== yesterday) {
      // If user had freezes remaining, save streak once
      if (parsed.freezesRemaining > 0) {
        parsed.freezesRemaining -= 1;
      } else {
        currentStreak = 0;
      }
    }

    const state: DailyStreakState = {
      currentStreak,
      bestStreak: Math.max(parsed.bestStreak || 0, currentStreak),
      lastActiveDate: parsed.lastActiveDate || '',
      activeDates: Array.isArray(parsed.activeDates) ? parsed.activeDates : [],
      freezesRemaining: Math.max(0, parsed.freezesRemaining ?? 1),
      streakLevel: getStreakLevel(currentStreak),
      hasCompletedToday,
    };

    return state;
  } catch {
    return DEFAULT_STREAK;
  }
}

export function saveDailyStreak(state: DailyStreakState): void {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('chemora:streak_update'));
  } catch {}
}

export function recordStreakActivity(): DailyStreakState {
  const current = getDailyStreak();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (current.hasCompletedToday) {
    return current;
  }

  const activeDates = Array.from(new Set([...current.activeDates, today]));
  let newStreak = current.currentStreak;

  if (current.lastActiveDate === yesterday) {
    newStreak += 1;
  } else if (current.lastActiveDate !== today) {
    newStreak = 1;
  }

  const bestStreak = Math.max(current.bestStreak, newStreak);

  const updated: DailyStreakState = {
    ...current,
    currentStreak: newStreak,
    bestStreak,
    lastActiveDate: today,
    activeDates,
    streakLevel: getStreakLevel(newStreak),
    hasCompletedToday: true,
  };

  saveDailyStreak(updated);
  return updated;
}

export interface DayActivity {
  dayName: string;
  dayNumber: number;
  dateStr: string;
  isCompleted: boolean;
  isToday: boolean;
}

export function getPast7DaysStreak(streak: DailyStreakState): DayActivity[] {
  const days: DayActivity[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isToday = i === 0;
    const isCompleted = streak.activeDates.includes(dateStr) || (isToday && streak.hasCompletedToday);

    days.push({
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      dateStr,
      isCompleted,
      isToday,
    });
  }

  return days;
}
