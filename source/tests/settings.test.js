function makeMemoryStorage() {
  let store = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = Object.create(null);
    },
    _peek() {
      return { ...store };
    },
  };
}

globalThis.localStorage = makeMemoryStorage();

const {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  DIFFICULTIES,
  THEMES,
  VIEW_MODES,
  COLOR_SCHEMES,
  MOBILE_MEDIA_QUERY,
  getDefaultSettings,
  sanitizeSettings,
  loadSettings,
  saveSettings,
  updateSettings,
  resetSettings,
  detectViewMode,
  resolveViewMode,
} = await import('../js/settings.js');

/**
 * Builds a fake window whose matchMedia reports a fixed match result and
 * records the last query it was asked about.
 */
function fakeWin(matches) {
  const calls = [];
  return {
    calls,
    matchMedia(query) {
      calls.push(query);
      return { matches, media: query, addEventListener() {}, removeEventListener() {} };
    },
  };
}

describe('settings defaults', () => {
  it('exposes a frozen default settings object', () => {
    expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
  });

  it('defaults to dark mode per the design doc', () => {
    expect(DEFAULT_SETTINGS.colorScheme).toBe('dark');
  });

  it('defaults to auto view-mode detection', () => {
    expect(DEFAULT_SETTINGS.autoViewMode).toBe(true);
  });

  it('exposes valid enum lists', () => {
    expect(DIFFICULTIES).toContain('beginner');
    expect(THEMES).toContain('default');
    expect(VIEW_MODES).toContain('desktop');
    expect(COLOR_SCHEMES).toEqual(jasmine.arrayContaining(['light', 'dark']));
  });

  it('getDefaultSettings returns a fresh copy each call', () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('sanitizeSettings', () => {
  it('returns defaults for null', () => {
    expect(sanitizeSettings(null)).toEqual(getDefaultSettings());
  });

  it('returns defaults for undefined', () => {
    expect(sanitizeSettings(undefined)).toEqual(getDefaultSettings());
  });

  it('returns defaults for non-object input', () => {
    expect(sanitizeSettings('not-an-object')).toEqual(getDefaultSettings());
    expect(sanitizeSettings(42)).toEqual(getDefaultSettings());
  });

  it('clamps volume below 0 to 0', () => {
    expect(sanitizeSettings({ volume: -3 }).volume).toBe(0);
  });

  it('clamps volume above 1 to 1', () => {
    expect(sanitizeSettings({ volume: 99 }).volume).toBe(1);
  });

  it('falls back to default volume for non-numeric volume', () => {
    expect(sanitizeSettings({ volume: 'loud' }).volume).toBe(DEFAULT_SETTINGS.volume);
  });

  it('rejects unknown difficulty values', () => {
    expect(sanitizeSettings({ difficulty: 'godmode' }).difficulty)
      .toBe(DEFAULT_SETTINGS.difficulty);
  });

  it('rejects unknown color scheme values', () => {
    expect(sanitizeSettings({ colorScheme: 'plaid' }).colorScheme)
      .toBe(DEFAULT_SETTINGS.colorScheme);
  });

  it('preserves valid settings unchanged', () => {
    const valid = {
      colorScheme: 'light',
      audioEnabled: false,
      volume: 0.25,
      countDownEnabled: true,
      theme: 'purple',
      viewMode: 'mobile',
      autoViewMode: false,
      fontSize: 1.25,
      reminderEnabled: true,
      reminderTime: '09:30',
    };
    expect(sanitizeSettings(valid)).toEqual(valid);
  });

  it('defaults autoViewMode to true when missing', () => {
    expect(sanitizeSettings({}).autoViewMode).toBe(true);
  });

  it('coerces non-boolean autoViewMode to default', () => {
    expect(sanitizeSettings({ autoViewMode: 'yes' }).autoViewMode)
      .toBe(DEFAULT_SETTINGS.autoViewMode);
  });

  it('preserves an explicit false autoViewMode', () => {
    expect(sanitizeSettings({ autoViewMode: false }).autoViewMode).toBe(false);
  });

  it('drops unknown fields', () => {
    const result = sanitizeSettings({ ...DEFAULT_SETTINGS, hackerMode: true });
    expect(result.hackerMode).toBeUndefined();
  });

  it('coerces non-boolean audioEnabled to default', () => {
    expect(sanitizeSettings({ audioEnabled: 'yes' }).audioEnabled)
      .toBe(DEFAULT_SETTINGS.audioEnabled);
  });
});

describe('detectViewMode', () => {
  it('returns mobile when the media query matches', () => {
    expect(detectViewMode(fakeWin(true))).toBe('mobile');
  });

  it('returns desktop when the media query does not match', () => {
    expect(detectViewMode(fakeWin(false))).toBe('desktop');
  });

  it('queries with MOBILE_MEDIA_QUERY', () => {
    const win = fakeWin(true);
    detectViewMode(win);
    expect(win.calls).toEqual([MOBILE_MEDIA_QUERY]);
  });

  it('returns desktop when matchMedia is unavailable', () => {
    expect(detectViewMode({})).toBe('desktop');
    expect(detectViewMode(undefined)).toBe('desktop');
  });

  it('returns desktop when matchMedia throws', () => {
    expect(detectViewMode({ matchMedia() { throw new Error('boom'); } })).toBe('desktop');
  });
});

describe('resolveViewMode', () => {
  it('uses the detected mode when autoViewMode is on, ignoring stored viewMode', () => {
    expect(resolveViewMode({ autoViewMode: true, viewMode: 'desktop' }, fakeWin(true)))
      .toBe('mobile');
    expect(resolveViewMode({ autoViewMode: true, viewMode: 'mobile' }, fakeWin(false)))
      .toBe('desktop');
  });

  it('uses the stored viewMode when autoViewMode is off, ignoring the device', () => {
    expect(resolveViewMode({ autoViewMode: false, viewMode: 'mobile' }, fakeWin(false)))
      .toBe('mobile');
    expect(resolveViewMode({ autoViewMode: false, viewMode: 'desktop' }, fakeWin(true)))
      .toBe('desktop');
  });
});

describe('settings localStorage round-trip', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('loadSettings returns defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(getDefaultSettings());
  });

  it('saveSettings then loadSettings returns the same values', () => {
    const written = saveSettings({
      colorScheme: 'light',
      audioEnabled: false,
      volume: 0.8,
      difficulty: 'intermediate',
      theme: 'orange',
      viewMode: 'mobile',
    });
    expect(loadSettings()).toEqual(written);
  });

  it('saveSettings persists JSON under STORAGE_KEY', () => {
    saveSettings({ ...DEFAULT_SETTINGS, volume: 0.42 });
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw).volume).toBe(0.42);
  });

  it('saveSettings sanitizes before persisting', () => {
    const written = saveSettings({ difficulty: 'godmode', volume: 99 });
    expect(written.difficulty).toBe(DEFAULT_SETTINGS.difficulty);
    expect(written.volume).toBe(1);
    expect(loadSettings()).toEqual(written);
  });

  it('updateSettings merges partial updates into stored settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, volume: 0.3, theme: 'yellow' });
    const after = updateSettings({ volume: 0.9 });
    expect(after.volume).toBe(0.9);
    expect(after.theme).toBe('yellow');
    expect(loadSettings()).toEqual(after);
  });

  it('resetSettings clears storage and returns defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'purple' });
    const result = resetSettings();
    expect(result).toEqual(getDefaultSettings());
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadSettings()).toEqual(getDefaultSettings());
  });
});

describe('settings recovery from missing or corrupt values', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('returns defaults when no settings are stored', () => {
    expect(loadSettings()).toEqual(getDefaultSettings());
  });

  it('returns defaults when stored value is not valid JSON', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSettings()).toEqual(getDefaultSettings());
  });

  it('returns defaults when stored value is a JSON primitive', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '42');
    expect(loadSettings()).toEqual(getDefaultSettings());
  });

  it('recovers individual invalid fields, keeping valid ones', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      colorScheme: 'light',
      audioEnabled: 'maybe',
      volume: 5,
      difficulty: 'godmode',
      theme: 'purple',
      viewMode: 'holographic',
    }));
    const loaded = loadSettings();
    expect(loaded.colorScheme).toBe('light');
    expect(loaded.theme).toBe('purple');
    expect(loaded.audioEnabled).toBe(DEFAULT_SETTINGS.audioEnabled);
    expect(loaded.volume).toBe(1);
    expect(loaded.difficulty).toBe(DEFAULT_SETTINGS.difficulty);
    expect(loaded.viewMode).toBe(DEFAULT_SETTINGS.viewMode);
  });

  it('survives missing fields by filling in defaults', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'orange' }));
    const loaded = loadSettings();
    expect(loaded.theme).toBe('orange');
    expect(loaded.colorScheme).toBe(DEFAULT_SETTINGS.colorScheme);
    expect(loaded.difficulty).toBe(DEFAULT_SETTINGS.difficulty);
    expect(loaded.volume).toBe(DEFAULT_SETTINGS.volume);
  });
});
