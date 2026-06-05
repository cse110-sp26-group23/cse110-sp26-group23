import { collectThemeColors } from '../js/renderPane.js';

// collectThemeColors snapshots the parent document's theme color variables into
// a `:root { ... }` rule injected into the preview iframe. It reads via the
// global getComputedStyle; the live-resolution path is exercised by the
// render-pane E2E spec in a real browser. Here we stub getComputedStyle so the
// allowlist filtering and string formatting are tested deterministically,
// independent of jsdom's (incomplete) custom-property resolution.

describe('collectThemeColors', () => {
  const root = {}; // opaque token; the stub ignores it.
  let originalGetComputedStyle;

  function stubComputedValues(map) {
    globalThis.getComputedStyle = () => ({
      getPropertyValue: (name) => (name in map ? map[name] : ''),
    });
  }

  beforeEach(() => {
    originalGetComputedStyle = globalThis.getComputedStyle;
  });

  afterEach(() => {
    globalThis.getComputedStyle = originalGetComputedStyle;
  });

  it('emits a :root rule with the allowlisted color variables', () => {
    stubComputedValues({
      '--brand-orange': '#f97316',
      '--surface': '#fffdfb',
      '--text': '#4a3a2e',
    });

    const css = collectThemeColors(root);

    expect(css.startsWith(':root {')).toBe(true);
    expect(css).toContain('--brand-orange: #f97316;');
    expect(css).toContain('--surface: #fffdfb;');
    expect(css).toContain('--text: #4a3a2e;');
  });

  it('excludes typing-UI and non-color tokens that are not on the allowlist', () => {
    stubComputedValues({
      '--brand-orange': '#f97316',
      // These resolve to values but must NOT be surfaced to the preview.
      '--cursor': '#f97316',
      '--char-correct': '#4a3a2e',
      '--space-md': '0.75rem',
      '--radius-md': '10px',
      '--font-ui': 'system-ui',
    });

    const css = collectThemeColors(root);

    expect(css).toContain('--brand-orange:');
    expect(css).not.toContain('--cursor');
    expect(css).not.toContain('--char-correct');
    expect(css).not.toContain('--space-md');
    expect(css).not.toContain('--radius-md');
    expect(css).not.toContain('--font-ui');
  });

  it('skips variables that resolve to an empty value', () => {
    stubComputedValues({
      '--brand-orange': '#f97316',
      '--surface': '   ',
    });

    const css = collectThemeColors(root);

    expect(css).toContain('--brand-orange: #f97316;');
    expect(css).not.toContain('--surface');
  });

  it('returns an empty string when no variables resolve', () => {
    stubComputedValues({});

    expect(collectThemeColors(root)).toBe('');
  });

  it('returns an empty string when getComputedStyle is unavailable', () => {
    globalThis.getComputedStyle = undefined;

    expect(collectThemeColors(root)).toBe('');
  });
});
