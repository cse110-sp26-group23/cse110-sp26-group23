/**
 * @file Progress module.
 *
 * Persists completed-level records (level id, difficulty, and round stats)
 * to localStorage under a namespaced key. Mirrors the load/save/reset
 * pattern from settings.js so both persistence layers stay consistent.
 *
 * Pure-logic exports — {@link loadProgress}, {@link recordLevelCompletion},
 * and {@link resetProgress} — have no DOM access and are covered by Jasmine
 * unit tests. There are no DOM-dependent helpers in this module.
 */

export const STORAGE_KEY = 'cse110-typing-game/progress';

/**
 * Safely gets localStorage, returning null if unavailable
 * (private browsing, quota exceeded, etc.).
 */
function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Loads the stored array of level completion records.
 * Returns [] when nothing is stored or data is corrupt.
 * @returns {object[]}
 */
export function loadProgress() {
  const storage = getStorage();
  if (!storage) return [];

  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @typedef {object} RoundStats
 * @property {number} wpm - Words per minute.
 * @property {number} accuracy - Accuracy percentage.
 * @property {number} errorCount - Number of errors made.
 * @property {number} elapsedSeconds - Time taken in seconds.
 */

/**
 * Appends one completed-level record to the stored history.
 * @param {string} levelId - ID of the completed level.
 * @param {string} difficulty - Difficulty setting active during the round.
 * @param {RoundStats} stats - Round stats from calculateRoundMetrics.
 * @returns {object} The record that was saved.
 */
export function recordLevelCompletion(levelId, difficulty, stats) {
  const record = {
    levelId,
    difficulty,
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    errorCount: stats.errorCount,
    elapsedSeconds: stats.elapsedSeconds,
    completedAt: Date.now(),
  };

  const existing = loadProgress();
  const updated = [...existing, record];

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage may be unavailable (quota, private mode). State still
      // returns to the caller so the in-memory session keeps working.
    }
  }

  return record;
}

/**
 * Wipes all stored progress — mirrors resetSettings().
 * @returns {object[]} empty array
 */
export function resetProgress() {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}
