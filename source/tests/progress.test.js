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
  };
}

globalThis.localStorage = makeMemoryStorage();

const {
  STORAGE_KEY,
  loadProgress,
  recordLevelCompletion,
  resetProgress,
} = await import('../js/progress.js');

const SAMPLE_STATS = {
  wpm: 50,
  accuracy: 95,
  errorCount: 3,
  elapsedSeconds: 20,
};

describe('loadProgress', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('returns [] when storage is empty', () => {
    expect(loadProgress()).toEqual([]);
  });

  it('returns [] when stored value is corrupt JSON', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadProgress()).toEqual([]);
  });

  it('returns [] when stored value is a JSON primitive', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '"string"');
    expect(loadProgress()).toEqual([]);
  });
});

describe('recordLevelCompletion', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('returns a record with all correct fields', () => {
    const record = recordLevelCompletion('beginner-1', 'beginner', SAMPLE_STATS);
    expect(record.levelId).toBe('beginner-1');
    expect(record.difficulty).toBe('beginner');
    expect(record.wpm).toBe(50);
    expect(record.accuracy).toBe(95);
    expect(record.errorCount).toBe(3);
    expect(record.elapsedSeconds).toBe(20);
    expect(typeof record.completedAt).toBe('number');
  });

  it('persists the record under STORAGE_KEY', () => {
    recordLevelCompletion('beginner-1', 'beginner', SAMPLE_STATS);
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.length).toBe(1);
    expect(parsed[0].levelId).toBe('beginner-1');
  });

  it('appends to existing records rather than overwriting', () => {
    recordLevelCompletion('beginner-1', 'beginner', SAMPLE_STATS);
    recordLevelCompletion('beginner-2', 'beginner', SAMPLE_STATS);
    const records = loadProgress();
    expect(records.length).toBe(2);
    expect(records[0].levelId).toBe('beginner-1');
    expect(records[1].levelId).toBe('beginner-2');
  });
});

describe('resetProgress', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('returns []', () => {
    expect(resetProgress()).toEqual([]);
  });

  it('clears storage so loadProgress returns [] and storage key is null', () => {
    recordLevelCompletion('beginner-1', 'beginner', SAMPLE_STATS);
    resetProgress();
    expect(loadProgress()).toEqual([]);
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
