/**
 * @file Settings module.
 *
 * Owns user-configurable game settings (theme, audio, countdown timer, etc.),
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
  countDownEnabled: false,
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
    countDownEnabled: typeof source.countDownEnabled === 'boolean'
      ? source.countDownEnabled
      : DEFAULT_SETTINGS.countDownEnabled,
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

/**
 * Builds a settings control styled as an editable code snippet, e.g.
 * `<audio volume="50" />`, laid out as a row with the label on the left
 * and the snippet on the right. The wrapping <code> looks like a line from
 * a source file; only the value token between the syntax spans is
 * interactive. The builder constructs DOM only — callers wire the events
 * on the returned nodes.
 *
 * @param {object} opts
 * @param {string} opts.label - Row label shown to the left of the snippet.
 * @param {string} opts.prefix - Muted syntax before the value (e.g. `<audio volume="`).
 * @param {string} opts.suffix - Muted syntax after the value (e.g. `" />`).
 * @param {string} opts.valueText - Initial value token text.
 * @param {'token'|'editable'} opts.interactive - `token` cycles through a fixed
 *   list on click/keys; `editable` is a free-typed contenteditable (volume).
 * @param {object} [opts.aria] - `{ label, valuemin, valuemax, valuenow, valuetext }`
 *   applied to the value span.
 * @returns {{ row: HTMLElement, code: HTMLElement, value: HTMLElement }}
 */
function buildCodeControl({ label, prefix, suffix, valueText, interactive, aria = {} }) {
  const row = document.createElement('div');
  row.classList.add('settings-code');

  const labelEl = document.createElement('span');
  labelEl.classList.add('settings-code-label');
  labelEl.textContent = label;
  row.appendChild(labelEl);

  const code = document.createElement('code');
  code.classList.add('settings-code-snippet');

  const prefixEl = document.createElement('span');
  prefixEl.classList.add('settings-code-syntax');
  prefixEl.textContent = prefix;

  const value = document.createElement('span');
  value.classList.add('settings-code-value');
  value.spellcheck = false;
  value.textContent = valueText;
  if (interactive === 'editable') {
    value.setAttribute('contenteditable', 'true');
    value.setAttribute('inputmode', 'numeric');
    value.setAttribute('role', 'spinbutton');
  } else {
    // A cyclable token: focusable and keyboard-operable, but not typed into.
    value.setAttribute('role', 'spinbutton');
    value.setAttribute('tabindex', '0');
  }
  if (aria.label) value.setAttribute('aria-label', aria.label);
  if (aria.valuemin !== undefined) value.setAttribute('aria-valuemin', String(aria.valuemin));
  if (aria.valuemax !== undefined) value.setAttribute('aria-valuemax', String(aria.valuemax));
  if (aria.valuenow !== undefined) value.setAttribute('aria-valuenow', String(aria.valuenow));
  if (aria.valuetext !== undefined) value.setAttribute('aria-valuetext', String(aria.valuetext));

  const suffixEl = document.createElement('span');
  suffixEl.classList.add('settings-code-syntax');
  suffixEl.textContent = suffix;

  code.append(prefixEl, value, suffixEl);
  row.appendChild(code);
  return { row, code, value };
}

function nextInList(list, current) {
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
}

function prevInList(list, current) {
  const idx = list.indexOf(current);
  return list[(idx - 1 + list.length) % list.length];
}

function audioValue(enabled) {
  return enabled ? 'true' : 'false';
}

function countDownValue(enabled) {
  return enabled ? 'countdown' : 'elapsed';
}

function themeValue(value) {
  return value;
}

function viewModeValue(value) {
  return value;
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
 * @param {function(string): void} [options.onViewModeChange] - Called when view mode changes.
 * @param {function(boolean): void} [options.onCountDownChange] - Called when the countdown toggle changes.
 * @param {boolean} [options.disableViewMode=false] - Disables the view-mode toggle (use during an active level).
 * @returns {SettingsScreen}
 */
export function createSettingsScreen({
  onRestart,
  onOpen,
  onClose,
  onViewModeChange,
  onCountDownChange,
  disableViewMode = false
} = {}) {
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

  // All settings are presented as a vertical stack of editable code
  // snippets, each reading like a line from a source file.
  const codeList = document.createElement('div');
  codeList.classList.add('settings-code-list');
  panel.appendChild(codeList);

  // Volume control: an editable HTML-attribute literal. Reads
  // `<audio volume="50" />`; only the numeric value (0..100) is
  // editable, so the surrounding syntax can't be broken by typing.
  // Live-commits to settings on every valid keystroke, so the user
  // hears the change as they type. ArrowUp / ArrowDown nudge by 5.
  // 0.5 -> "50". Round so the seed value never carries float noise like
  // "50.00000001" that would be uglier than the rest of the syntax.
  const volumeText = String(Math.round(current.volume * 100));
  const volumeCtl = buildCodeControl({
    label: 'Volume',
    prefix: '<audio volume="',
    suffix: '" />',
    valueText: volumeText,
    interactive: 'editable',
    aria: { label: 'Volume from 0 to 100', valuemin: 0, valuemax: 100, valuenow: volumeText },
  });
  const { code, value } = volumeCtl;

  // Boolean / enum controls cycle through a fixed list of values instead
  // of being typed into. Clicking the value (or ▲/▼) advances it.
  const audioCtl = buildCodeControl({
    label: 'Audio',
    prefix: '<audio enabled="',
    suffix: '" />',
    valueText: audioValue(current.audioEnabled),
    interactive: 'token',
    aria: { label: 'Audio enabled', valuetext: audioValue(current.audioEnabled) },
  });

  const countDownCtl = buildCodeControl({
    label: 'Timer',
    prefix: '<timer mode="',
    suffix: '" />',
    valueText: countDownValue(current.countDownEnabled),
    interactive: 'token',
    aria: { label: 'Timer mode', valuetext: countDownValue(current.countDownEnabled) },
  });

  const themeCtl = buildCodeControl({
    label: 'Theme',
    prefix: '<theme name="',
    suffix: '" />',
    valueText: themeValue(current.theme),
    interactive: 'token',
    aria: { label: 'Theme', valuetext: themeValue(current.theme) },
  });

  const viewModeCtl = buildCodeControl({
    label: 'View',
    prefix: '<view mode="',
    suffix: '" />',
    valueText: viewModeValue(current.viewMode),
    interactive: 'token',
    aria: { label: 'View mode', valuetext: viewModeValue(current.viewMode) },
  });

  codeList.append(
    volumeCtl.row,
    audioCtl.row,
    countDownCtl.row,
    themeCtl.row,
    viewModeCtl.row,
  );

  // Restart is an action, not a setting, so it stays a plain button apart
  // from the code snippets.
  const restartBtn = document.createElement('button');
  restartBtn.type = 'button';
  restartBtn.classList.add('settings-restart');
  restartBtn.textContent = 'Restart Level';
  panel.appendChild(restartBtn);

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

  // Sets a cyclable token's displayed text and keeps its aria value in sync.
  function setTokenValue(valueEl, text) {
    valueEl.textContent = text;
    valueEl.setAttribute('aria-valuetext', text);
  }

  // Wires a cyclable token control: clicking the value (or pressing the
  // arrow keys while focused) advances/reverses through the list, commits
  // the change, and updates the displayed token.
  function wireToken(ctl, { next, prev, apply }) {
    const advance = () => {
      const value = next();
      apply(value);
    };
    const reverse = () => {
      const value = prev();
      apply(value);
    };
    ctl.value.addEventListener('click', advance);
    ctl.value.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        event.preventDefault();
        advance();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        event.preventDefault();
        reverse();
      } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        advance();
      }
    });
  }

  wireToken(audioCtl, {
    next: () => !current.audioEnabled,
    prev: () => !current.audioEnabled,
    apply: (enabled) => {
      commit({ audioEnabled: enabled });
      setTokenValue(audioCtl.value, audioValue(enabled));
    },
  });

  wireToken(countDownCtl, {
    next: () => !current.countDownEnabled,
    prev: () => !current.countDownEnabled,
    apply: (enabled) => {
      commit({ countDownEnabled: enabled });
      setTokenValue(countDownCtl.value, countDownValue(enabled));
      if (typeof onCountDownChange === 'function') onCountDownChange(enabled);
    },
  });

  wireToken(themeCtl, {
    next: () => nextInList(THEMES, current.theme),
    prev: () => prevInList(THEMES, current.theme),
    apply: (theme) => {
      commit({ theme });
      setTokenValue(themeCtl.value, themeValue(theme));
    },
  });

  if (disableViewMode) {
    // View mode can't be changed during an active level; dim it and skip
    // wiring its handlers so the token is inert.
    viewModeCtl.row.classList.add('is-disabled');
    viewModeCtl.value.setAttribute('aria-disabled', 'true');
    viewModeCtl.value.removeAttribute('tabindex');
    viewModeCtl.value.title = 'View mode can only be changed on the level select screen';
  } else {
    wireToken(viewModeCtl, {
      next: () => nextInList(VIEW_MODES, current.viewMode),
      prev: () => prevInList(VIEW_MODES, current.viewMode),
      apply: (viewMode) => {
        commit({ viewMode });
        setTokenValue(viewModeCtl.value, viewModeValue(viewMode));
        if (typeof onViewModeChange === 'function') onViewModeChange(viewMode);
      },
    });
  }

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

  // Nudge logic for the ArrowUp/ArrowDown keys: move by ±5 and live-commit.
  function nudgeVolume(delta) {
    const currentN = readVolume() ?? Math.round(current.volume * 100);
    const next = Math.max(0, Math.min(100, currentN + delta));
    setVolumeText(next);
    commit({ volume: next / 100 });
  }

  value.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      nudgeVolume(event.key === 'ArrowUp' ? 5 : -5);
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

     if (typeof onOpen === 'function') {
      onOpen();
    }
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
 * @param {function(string): void} [options.onViewModeChange] - Forwarded to the overlay.
 * @param {function(boolean): void} [options.onCountDownChange] - Forwarded to the overlay.
 * @param {boolean} [options.disableViewMode=false] - Forwarded to the overlay; disables view-mode toggle during a level.
 * @returns {SettingsScreen|null}
 */
export function initSettings({
  buttonSelector = '.settings-button',
  mountSelector = 'body',
  onRestart,
  onOpen,
  onClose,
  onViewModeChange,
  onCountDownChange,
  disableViewMode = false,
} = {}) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return null;

  const screen = createSettingsScreen({
  onRestart,
  onOpen,
  onClose,
  onViewModeChange,
  onCountDownChange,
  disableViewMode
});
  mount.appendChild(screen.element);


  const button = document.querySelector(buttonSelector);
  if (button) {
    button.addEventListener('click', screen.open);
  }

  return screen;
}
