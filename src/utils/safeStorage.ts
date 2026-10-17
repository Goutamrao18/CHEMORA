/**
 * Safe versioned storage abstraction with schema guards,
 * corrupt data healing, and zero-crash fallbacks.
 */

export interface StorageSchema<T> {
  version: number;
  data: T;
  savedAt: number;
}

export function safeGetItem<T>(key: string, defaultValue: T, validator?: (val: any) => boolean): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;

    const parsed = JSON.parse(raw);

    // If wrapped in versioned envelope
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      if (validator && !validator(parsed.data)) {
        console.warn(`[SafeStorage] Data validation failed for versioned key "${key}". Returning fallback.`);
        return defaultValue;
      }
      return parsed.data as T;
    }

    // Unversioned legacy data
    if (validator && !validator(parsed)) {
      console.warn(`[SafeStorage] Data validation failed for unversioned key "${key}". Returning fallback.`);
      return defaultValue;
    }

    return parsed as T;
  } catch (err) {
    console.warn(`[SafeStorage] Corrupted or inaccessible storage for "${key}". Resetting to default.`, err);
    return defaultValue;
  }
}

export function safeSetItem<T>(key: string, value: T, version = 1): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const payload: StorageSchema<T> = {
      version,
      data: value,
      savedAt: Date.now(),
    };

    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to save key "${key}" (quota exceeded or storage blocked):`, err);
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage restrictions
  }
}
