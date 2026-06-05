/**
 * @file Atomic project facts referenced by the E2E suite.
 *
 * Mirrors values defined in source/js/settings.js. When a setting changes
 * shape there, update this file once and every spec that imports from it
 * stays correct.
 */

// Mirrors STORAGE_KEY in source/js/settings.js.
export const STORAGE_KEY = 'cse110-typing-game/settings';

// Mirrors STORAGE_KEY in source/js/progress.js.
export const PROGRESS_STORAGE_KEY = 'cse110-typing-game/progress';

// Seeding baseline for the E2E suite. autoViewMode is false here (the app
// default is true) so a seeded viewMode is honored deterministically rather
// than being overridden by the headless browser's auto-detected mode.
export const DEFAULT_SETTINGS = Object.freeze({
  colorScheme: 'dark',
  audioEnabled: true,
  volume: 0.5,
  difficulty: 'beginner',
  theme: 'default',
  viewMode: 'desktop',
  autoViewMode: false,
});

export const COLOR_SCHEMES = Object.freeze(['dark', 'light']);
export const THEMES = Object.freeze(['default', 'yellow', 'purple', 'orange']);
export const DIFFICULTIES = Object.freeze(['beginner', 'intermediate', 'expert']);
export const VIEW_MODES = Object.freeze(['desktop', 'mobile']);
