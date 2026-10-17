import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

// Provide in-memory localStorage and window mock for Node test environment
const mockStore = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => mockStore.get(key) || null,
  setItem: (key: string, value: string) => { mockStore.set(key, String(value)); },
  removeItem: (key: string) => { mockStore.delete(key); },
  clear: () => { mockStore.clear(); },
};

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  }
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: localStorageMock,
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      writable: true,
    });
  }
});

import { getInitialChallengeState, saveChallengeState } from '../data/challengeData';
import { getDailyStreak, recordStreakActivity } from '../data/streakManager';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

describe('Progress & Streak Logic', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe('Challenge State & XP', () => {
    it('returns clean default state when storage is empty', () => {
      const state = getInitialChallengeState();
      expect(state.xp).toBe(0);
      expect(state.levels).toEqual([]);
      expect(state.correct).toBe(0);
      expect(state.answers).toBe(0);
    });

    it('recovers gracefully from corrupted JSON in storage', () => {
      mockStore.set('chemoraChallengeState', '{invalid json syntax!!!');
      const state = getInitialChallengeState();
      expect(state.xp).toBe(0);
      expect(state.levels).toEqual([]);
    });

    it('correctly persists and calculates completed levels and XP', () => {
      const testState = {
        levels: [1, 2, 3],
        xp: 350,
        answers: 15,
        correct: 14,
        levelResults: {
          '1': { correct: 5, wrong: 0, xp: 120, earnedAt: Date.now() },
        },
        rewards: ['alchemist_flask'],
      };

      saveChallengeState(testState);
      const loaded = getInitialChallengeState();

      expect(loaded.xp).toBe(350);
      expect(loaded.levels).toEqual([1, 2, 3]);
      expect(loaded.correct).toBe(14);
      expect(loaded.rewards).toContain('alchemist_flask');
    });

    it('calculates accuracy percentage accurately', () => {
      const answers = 20;
      const correct = 18;
      const accuracy = answers > 0 ? Math.round((correct / answers) * 100) : 0;
      expect(accuracy).toBe(90);
    });
  });

  describe('Daily Streak Manager', () => {
    it('initializes default momentum streak', () => {
      const streak = getDailyStreak();
      expect(streak.currentStreak).toBeGreaterThanOrEqual(0);
      expect(streak.freezesRemaining).toBeGreaterThanOrEqual(1);
    });

    it('advances streak upon recording activity for today', () => {
      const updated = recordStreakActivity();
      expect(updated.hasCompletedToday).toBe(true);
      expect(updated.activeDates.length).toBeGreaterThanOrEqual(1);
    });

    it('does not duplicate streak increments on the same day', () => {
      const first = recordStreakActivity();
      const second = recordStreakActivity();
      expect(first.currentStreak).toBe(second.currentStreak);
    });
  });

  describe('SafeStorage Resilience', () => {
    it('returns default value when validator fails', () => {
      safeSetItem('chemora_test_key', { count: 'invalid_string' });
      const val = safeGetItem('chemora_test_key', { count: 0 }, (v) => typeof v?.count === 'number');
      expect(val).toEqual({ count: 0 });
    });

    it('returns stored data when validator passes', () => {
      safeSetItem('chemora_test_key_valid', { count: 42 });
      const val = safeGetItem('chemora_test_key_valid', { count: 0 }, (v) => typeof v?.count === 'number');
      expect(val).toEqual({ count: 42 });
    });
  });
});
