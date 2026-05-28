/**
 * @file Atomic project facts referenced by the E2E suite.
 *
 * Mirrors values defined in source/js/settings.js. When a setting changes
 * shape there, update this file once and every spec that imports from it
 * stays correct.
 */

// Mirrors STORAGE_KEY in source/js/settings.js.
export const STORAGE_KEY = 'cse110-typing-game/settings';

export const DEFAULT_SETTINGS = Object.freeze({
  colorScheme: 'dark',
  audioEnabled: true,
  volume: 0.5,
  difficulty: 'beginner',
  theme: 'default',
  viewMode: 'desktop',
});

export const COLOR_SCHEMES = Object.freeze(['dark', 'light']);
export const THEMES = Object.freeze(['default', 'yellow', 'purple', 'orange']);
export const DIFFICULTIES = Object.freeze(['beginner', 'intermediate', 'expert']);
export const VIEW_MODES = Object.freeze(['desktop', 'mobile']);
