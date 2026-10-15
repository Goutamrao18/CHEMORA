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

const STORAGE_KEY = 'chemoraChallengeState';

export function getInitialChallengeState(): ChallengeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { levels: [], xp: 0, answers: 0, correct: 0, levelResults: {}, rewards: [] };
    const parsed = JSON.parse(raw);
    return {
      levels: Array.isArray(parsed.levels) ? parsed.levels.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 100) : [],
      xp: Math.max(0, Number(parsed.xp) || 0),
      answers: Math.max(0, Number(parsed.answers) || 0),
      correct: Math.max(0, Number(parsed.correct) || 0),
      levelResults: parsed.levelResults && typeof parsed.levelResults === 'object' ? parsed.levelResults : {},
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards : []
    };
  } catch {
    return { levels: [], xp: 0, answers: 0, correct: 0, levelResults: {}, rewards: [] };
  }
}

export function saveChallengeState(state: ChallengeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('chemora:progress'));
  } catch {
    // Storage quota or restricted access fallback
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
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.questions)) return data.questions;
      }
    } catch {
      // try next path
    }
  }
  return [];
}
