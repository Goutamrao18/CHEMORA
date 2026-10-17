export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: string;
  points: number;
  topic: string;
}

export interface LevelResult {
  correct: number;
  wrong: number;
  xp: number;
  earnedAt: number;
}

export interface ChallengeState {
  levels: number[];
  xp: number;
  answers: number;
  correct: number;
  levelResults: Record<string, LevelResult>;
  rewards: string[];
}

import { safeGetItem, safeSetItem } from '../utils/safeStorage';
import { fetchWithRetry } from '../utils/fetchWithRetry';

const STORAGE_KEY = 'chemoraChallengeState';

const DEFAULT_CHALLENGE_STATE: ChallengeState = {
  levels: [],
  xp: 0,
  answers: 0,
  correct: 0,
  levelResults: {},
  rewards: [],
};

function isValidChallengeState(val: any): boolean {
  return (
    val &&
    typeof val === 'object' &&
    (Array.isArray(val.levels) || typeof val.xp === 'number')
  );
}

export function getInitialChallengeState(): ChallengeState {
  const loaded = safeGetItem<ChallengeState>(STORAGE_KEY, DEFAULT_CHALLENGE_STATE, isValidChallengeState);
  return {
    levels: Array.isArray(loaded.levels) ? loaded.levels.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 100) : [],
    xp: Math.max(0, Number(loaded.xp) || 0),
    answers: Math.max(0, Number(loaded.answers) || 0),
    correct: Math.max(0, Number(loaded.correct) || 0),
    levelResults: loaded.levelResults && typeof loaded.levelResults === 'object' ? loaded.levelResults : {},
    rewards: Array.isArray(loaded.rewards) ? loaded.rewards : [],
  };
}

export function saveChallengeState(state: ChallengeState): void {
  safeSetItem(STORAGE_KEY, state, 1);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('chemora:progress'));
  }
}

export async function fetchLevelQuestions(level: number): Promise<Question[]> {
  const padded = String(level).padStart(3, '0');
  const urls = [
    `/challenge/data/level-${padded}.json`,
    `challenge/data/level-${padded}.json`
  ];
  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url, { timeoutMs: 5000, retries: 1 });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.questions)) return data.questions;
      }
    } catch {
      // Continue to fallback url
    }
  }
  return [];
}
