/**
 * @file Settings module.
 *
 * Owns user-configurable game settings (theme, audio, difficulty, etc.),
 * persists them to localStorage, and builds the settings overlay shown
 * over the game screen when the settings button is pressed.
 *
 * Pure-logic helpers (defaults, sanitization, load/save) are exported for
 * unit testing. UI helpers (createSettingsScreen, initSettings) are
 * DOM-dependent and are covered by E2E tests.
 */

/**
 * Allowed difficulty levels.
 * @readonly
 * @type {ReadonlyArray<string>}
 */
export const DIFFICULTIES = Object.freeze(['beginner', 'intermediate', 'expert']);

/**
 * Allowed color themes (separate from light/dark mode).
 * @readonly
 * @type {ReadonlyArray<string>}
 */
export const THEMES = Object.freeze(['default', 'yellow', 'purple', 'orange']);

/**
 * Allowed view modes.
 * @readonly
 * @type {ReadonlyArray<string>}
 */
export const VIEW_MODES = Object.freeze(['desktop', 'mobile']);

/**
 * Allowed color schemes for light/dark mode.
 * @readonly
 * @type {ReadonlyArray<string>}
 */
export const COLOR_SCHEMES = Object.freeze(['dark', 'light']);

/**
 * localStorage key used to persist settings.
 * @type {string}
 */
export const STORAGE_KEY = 'cse110-typing-game/settings';

/**
 * Name of the CustomEvent dispatched on `document` whenever the settings
 * overlay commits a change. The detail payload is the new full settings
 * object. Subscribers (e.g. the audio module) use this to react to
 * volume and toggle changes without polling localStorage.
 * @type {string}
 */
export const SETTINGS_CHANGE_EVENT = 'cse110-settings-change';

/**
 * Default settings. Dark mode is the design default per design.md.
 * @readonly
 */
export const DEFAULT_SETTINGS = Object.freeze({
  colorScheme: 'dark',
  audioEnabled: true,
  volume: 0.5,
  difficulty: 'beginner',
  theme: 'default',
  viewMode: 'desktop',
});

/**
 * Returns a fresh copy of the default settings.
 * @returns {object} Default settings object
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

function clampVolume(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_SETTINGS.volume;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function pickEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/**
 * Returns a valid settings object built from the given input. Unknown
 * fields are dropped, missing fields fall back to defaults, and invalid
 * values are replaced with defaults. Safe to call on null, undefined,
 * partially-corrupt objects, or arbitrary user-supplied data.
 * @param {*} maybe - Possibly-invalid settings input
 * @returns {object} A complete, valid settings object
 */
export function sanitizeSettings(maybe) {
  const source = maybe && typeof maybe === 'object' ? maybe : {};
  return {
    colorScheme: pickEnum(source.colorScheme, COLOR_SCHEMES, DEFAULT_SETTINGS.colorScheme),
    audioEnabled: typeof source.audioEnabled === 'boolean'
      ? source.audioEnabled
      : DEFAULT_SETTINGS.audioEnabled,
    volume: source.volume === undefined || source.volume === null
      ? DEFAULT_SETTINGS.volume
      : clampVolume(source.volume),
    difficulty: pickEnum(source.difficulty, DIFFICULTIES, DEFAULT_SETTINGS.difficulty),
    theme: pickEnum(source.theme, THEMES, DEFAULT_SETTINGS.theme),
    viewMode: pickEnum(source.viewMode, VIEW_MODES, DEFAULT_SETTINGS.viewMode),
  };
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Loads settings from localStorage, returning defaults if no settings are
 * stored or if the stored value is missing/corrupt/unparseable.
 * @returns {object} A valid settings object
 */
export function loadSettings() {
  const storage = getStorage();
  if (!storage) return getDefaultSettings();

  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return getDefaultSettings();
  }

  if (raw === null || raw === undefined) return getDefaultSettings();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return getDefaultSettings();
  }

  return sanitizeSettings(parsed);
}

/**
 * Saves the given settings to localStorage after sanitizing them.
 * @param {object} settings - Settings to persist
 * @returns {object} The sanitized settings that were actually written
 */
export function saveSettings(settings) {
  const clean = sanitizeSettings(settings);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Storage may be unavailable (quota, private mode). State still
      // returns to the caller so the in-memory session keeps working.
    }
  }
  return clean;
}

/**
 * Merges a partial update into the currently-stored settings and saves
 * the result. Useful for one-field changes from the UI.
 * @param {object} partial - Fields to overwrite
 * @returns {object} The full sanitized settings after the update
 */
export function updateSettings(partial) {
  const current = loadSettings();
  return saveSettings({ ...current, ...partial });
}

/**
 * Clears stored settings and returns the defaults.
 * @returns {object} Fresh default settings
 */
export function resetSettings() {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return getDefaultSettings();
}

/**
 * Applies settings to the document by setting data attributes on
 * <html>. CSS can hook into [data-color-scheme], [data-theme], and
 * [data-view-mode] to switch styling.
 * @param {object} settings - Sanitized settings object
 * @param {Document} [doc] - Document to mutate, defaults to globalThis.document
 */
export function applySettings(settings, doc = globalThis.document) {
  if (!doc || !doc.documentElement) return;
  const root = doc.documentElement;
  root.setAttribute('data-color-scheme', settings.colorScheme);
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-view-mode', settings.viewMode);
}

function buildToggleButton(label, pressed) {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('settings-option');
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.textContent = label;
  return button;
}

function buildCycleButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('settings-option');
  button.textContent = label;
  return button;
}

function nextInList(list, current) {
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
}

function colorSchemeLabel(scheme) {
  return `Mode: ${scheme === 'light' ? 'Light' : 'Dark'}`;
}

function audioLabel(enabled) {
  return `Audio: ${enabled ? 'On' : 'Off'}`;
}

function difficultyLabel(value) {
  return `Difficulty: ${value[0].toUpperCase()}${value.slice(1)}`;
}

function themeLabel(value) {
  return `Theme: ${value[0].toUpperCase()}${value.slice(1)}`;
}

function viewModeLabel(value) {
  return `View: ${value === 'desktop' ? 'Desktop' : 'Mobile'}`;
}

/**
 * @typedef {object} SettingsScreen
 * @property {HTMLElement} element - The overlay DOM element.
 * @property {function(): void} open - Shows the overlay.
 * @property {function(): void} close - Hides the overlay.
 * @property {function(): object} getSettings - Returns a snapshot of current settings.
 */

/**
 * Builds the settings overlay element and returns a controller for it.
 * The overlay is hidden until {@link SettingsScreen#open} is called.
 *
 * Mutating a control inside the overlay immediately persists the change
 * via {@link updateSettings} and re-applies via {@link applySettings}.
 *
 * @param {object} [options]
 * @param {function(): void} [options.onRestart] - Called when "Restart Level" is pressed.
 * @param {function(): void} [options.onClose] - Called after the overlay closes.
 * @returns {SettingsScreen}
 */
export function createSettingsScreen({ onRestart, onClose, onViewModeChange } = {}) {
  let current = loadSettings();
  applySettings(current);

  const overlay = document.createElement('div');
  overlay.classList.add('settings-overlay');
  overlay.setAttribute('hidden', '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Settings');

  const panel = document.createElement('div');
  panel.classList.add('settings-panel');
  overlay.appendChild(panel);

  const title = document.createElement('h2');
  title.classList.add('settings-title');
  title.textContent = 'Settings';
  panel.appendChild(title);

  const grid = document.createElement('div');
  grid.classList.add('settings-grid');
  panel.appendChild(grid);

  const colorSchemeBtn = buildToggleButton(
    colorSchemeLabel(current.colorScheme),
    current.colorScheme === 'light',
  );
  const audioBtn = buildToggleButton(audioLabel(current.audioEnabled), current.audioEnabled);
  const difficultyBtn = buildCycleButton(difficultyLabel(current.difficulty));
  const themeBtn = buildCycleButton(themeLabel(current.theme));
  const restartBtn = buildCycleButton('Restart Level');
  const viewModeBtn = buildCycleButton(viewModeLabel(current.viewMode));

  grid.append(colorSchemeBtn, audioBtn, difficultyBtn, themeBtn, restartBtn, viewModeBtn);

  // Volume control: an editable HTML-attribute literal. Reads
  // `<audio volume="50" />`; only the numeric value (0..100) is
  // editable, so the surrounding syntax can't be broken by typing.
  // Live-commits to settings on every valid keystroke, so the user
  // hears the change as they type. ArrowUp / ArrowDown nudge by 5.
  const volumeRow = document.createElement('div');
  volumeRow.classList.add('settings-volume');
  const volumeLabel = document.createElement('span');
  volumeLabel.classList.add('settings-volume-label');
  volumeLabel.textContent = 'Volume';
  volumeRow.appendChild(volumeLabel);

  const code = document.createElement('code');
  code.classList.add('settings-volume-code');

  const prefix = document.createElement('span');
  prefix.classList.add('settings-volume-syntax');
  prefix.textContent = '<audio volume="';

  const value = document.createElement('span');
  value.classList.add('settings-volume-value');
  value.setAttribute('contenteditable', 'true');
  value.setAttribute('inputmode', 'numeric');
  value.setAttribute('role', 'spinbutton');
  value.setAttribute('aria-label', 'Volume from 0 to 100');
  value.setAttribute('aria-valuemin', '0');
  value.setAttribute('aria-valuemax', '100');
  value.spellcheck = false;
  // 0.5 -> "50". Round so the seed value never carries float noise like
  // "50.00000001" that would be uglier than the rest of the syntax.
  value.textContent = String(Math.round(current.volume * 100));
  value.setAttribute('aria-valuenow', value.textContent);

  const suffix = document.createElement('span');
  suffix.classList.add('settings-volume-syntax');
  suffix.textContent = '" />';

  code.append(prefix, value, suffix);
  volumeRow.appendChild(code);
  panel.appendChild(volumeRow);

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.classList.add('settings-exit');
  exitBtn.textContent = 'Exit';
  panel.appendChild(exitBtn);

  function commit(partial) {
    current = updateSettings(partial);
    applySettings(current);
    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      document.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { ...current } }),
      );
    }
  }

  colorSchemeBtn.addEventListener('click', () => {
    const next = current.colorScheme === 'light' ? 'dark' : 'light';
    commit({ colorScheme: next });
    colorSchemeBtn.textContent = colorSchemeLabel(next);
    colorSchemeBtn.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
  });

  audioBtn.addEventListener('click', () => {
    const next = !current.audioEnabled;
    commit({ audioEnabled: next });
    audioBtn.textContent = audioLabel(next);
    audioBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
  });

  difficultyBtn.addEventListener('click', () => {
    const next = nextInList(DIFFICULTIES, current.difficulty);
    commit({ difficulty: next });
    difficultyBtn.textContent = difficultyLabel(next);
  });

  themeBtn.addEventListener('click', () => {
    const next = nextInList(THEMES, current.theme);
    commit({ theme: next });
    themeBtn.textContent = themeLabel(next);
  });

  viewModeBtn.addEventListener('click', () => {
    const next = nextInList(VIEW_MODES, current.viewMode);
    commit({ viewMode: next });
    viewModeBtn.textContent = viewModeLabel(next);
    if (typeof onViewModeChange === 'function') onViewModeChange(next);
  });

  // Pull the digits currently in the value span, clamp to 0..100, and
  // commit as a 0..1 volume. Empty / non-numeric input leaves the
  // committed volume unchanged so the user can briefly backspace the
  // whole number before typing the new one.
  function readVolume() {
    const digits = (value.textContent || '').replace(/\D+/g, '');
    if (digits === '') return null;
    return Math.max(0, Math.min(100, Number(digits)));
  }

  function setVolumeText(n) {
    value.textContent = String(n);
    value.setAttribute('aria-valuenow', String(n));
    // Move the cursor to the end of the new number so successive nudges
    // don't leave the caret stranded inside the digits.
    const range = document.createRange();
    range.selectNodeContents(value);
    range.collapse(false);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  value.addEventListener('input', () => {
    // Strip anything that isn't a digit so the syntax stays valid; if
    // the result is empty, leave the displayed text alone (the user is
    // mid-edit) but skip the commit until digits return.
    const cleaned = (value.textContent || '').replace(/\D+/g, '').slice(0, 3);
    if (cleaned !== value.textContent) {
      setVolumeText(cleaned || '');
    }
    const n = readVolume();
    if (n !== null) {
      value.setAttribute('aria-valuenow', String(n));
      commit({ volume: n / 100 });
    }
  });

  value.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? 5 : -5;
      const currentN = readVolume() ?? Math.round(current.volume * 100);
      const next = Math.max(0, Math.min(100, currentN + step));
      setVolumeText(next);
      commit({ volume: next / 100 });
    } else if (event.key === 'Enter') {
      // Enter shouldn't insert a newline in a single-line value.
      event.preventDefault();
      value.blur();
    }
  });

  value.addEventListener('blur', () => {
    // If the user left the field empty or out-of-range, snap back to
    // the last committed value so the displayed syntax is always valid.
    const n = readVolume();
    if (n === null) setVolumeText(Math.round(current.volume * 100));
    else setVolumeText(n);
  });

  // Clicking anywhere on the code line (including the static syntax
  // around the number) focuses the editable value so the click target
  // stays large.
  code.addEventListener('click', (event) => {
    if (event.target !== value) {
      value.focus();
      // Place cursor at the end of the existing digits.
      const range = document.createRange();
      range.selectNodeContents(value);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  });

  restartBtn.addEventListener('click', () => {
    close();
    if (typeof onRestart === 'function') onRestart();
  });

  function open() {
    overlay.removeAttribute('hidden');
  }

  function close() {
    overlay.setAttribute('hidden', '');
    if (typeof onClose === 'function') onClose();
  }

  exitBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  return {
    element: overlay,
    open,
    close,
    getSettings: () => ({ ...current }),
  };
}

/**
 * Initializes the settings module on the game page: applies stored
 * settings to the document, mounts the overlay, and wires the given
 * settings button to open it.
 *
 * @param {object} [options]
 * @param {string} [options.buttonSelector] - Selector for the button that opens the overlay.
 * @param {string} [options.mountSelector] - Selector for the element the overlay is appended to.
 * @param {function(): void} [options.onRestart] - Forwarded to the overlay.
 * @returns {SettingsScreen|null}
 */
export function initSettings({
  buttonSelector = '.settings-button',
  mountSelector = 'body',
  onRestart,
  onViewModeChange,
} = {}) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return null;

  const screen = createSettingsScreen({ onRestart, onViewModeChange });
  mount.appendChild(screen.element);

  const button = document.querySelector(buttonSelector);
  if (button) {
    button.addEventListener('click', screen.open);
  }

  return screen;
}
