import {
  MODES,
  stripMarkers,
  extractSnippets,
  hasSnippets,
  validateLevel,
  sanitizeLevel,
  sanitizePack,
  validateManifest,
  filterByDifficulty,
  nextLevelId,
  fetchManifest,
  fetchPack,
  loadLevel,
  loadLevels,
} from '../js/prompts.js';

// A minimal fetch stub: resolves to a Response-like object whose json() yields
// `payload`. `ok` and `status` are configurable to exercise failure paths.
function fakeFetch(payload, { ok = true, status = 200 } = {}) {
  return async () => ({ ok, status, json: async () => payload });
}

// Routes a fetch by substring of the requested URL, so loadLevel's manifest
// fetch and pack fetch can return different payloads in one test.
function routedFetch(routes) {
  return async (url) => {
    const key = String(url);
    const match = Object.keys(routes).find((part) => key.includes(part));
    if (!match) return { ok: false, status: 404, json: async () => null };
    return { ok: true, status: 200, json: async () => routes[match] };
  };
}

describe('stripMarkers', () => {
  it('strips delimiters from a class name', () => {
    expect(stripMarkers('<div class="{{row}}">')).toBe('<div class="row">');
  });

  it('strips a CSS value marker', () => {
    expect(stripMarkers('display: {{flex}};')).toBe('display: flex;');
  });

  it('strips multiple markers across lines', () => {
    expect(stripMarkers('<{{h1}}>\n.box { color: {{red}}; }')).toBe('<h1>\n.box { color: red; }');
  });

  it('leaves an unbalanced marker untouched', () => {
    expect(stripMarkers('<div class="{{row">')).toBe('<div class="{{row">');
  });

  it('removes empty markers', () => {
    expect(stripMarkers('a{{}}b')).toBe('ab');
  });

  it('returns an empty string for non-string input', () => {
    expect(stripMarkers(null)).toBe('');
  });
});

describe('extractSnippets', () => {
  it('extracts the inner text of a single marker', () => {
    const result = extractSnippets('<div class="{{row}}">');
    expect(result).toEqual([{ line: 0, snippet: 'row', scaffold: '<div class="row">' }]);
  });

  it('reports null for a line with no marker', () => {
    const result = extractSnippets('</div>');
    expect(result).toEqual([{ line: 0, snippet: null, scaffold: '</div>' }]);
  });

  it('indexes lines and keeps per-line snippets', () => {
    const result = extractSnippets('.row { display: {{flex}}; }\n.box { color: {{red}}; }');
    expect(result[0].snippet).toBe('flex');
    expect(result[1].snippet).toBe('red');
    expect(result[1].line).toBe(1);
  });

  it('uses the first marker when a line has two, and strips both', () => {
    spyOn(console, 'warn');
    const result = extractSnippets('<{{div}} class="{{row}}">');
    expect(result[0].snippet).toBe('div');
    expect(result[0].scaffold).toBe('<div class="row">');
    expect(console.warn).toHaveBeenCalled();
  });

  it('treats a malformed marker as no snippet', () => {
    const result = extractSnippets('<div class="{{row">');
    expect(result[0].snippet).toBeNull();
    expect(result[0].scaffold).toBe('<div class="{{row">');
  });
});

describe('hasSnippets', () => {
  it('is true when a non-empty snippet exists', () => {
    expect(hasSnippets('display: {{flex}};')).toBe(true);
  });

  it('is false for plain text', () => {
    expect(hasSnippets('display: flex;')).toBe(false);
  });

  it('is false for empty markers only', () => {
    expect(hasSnippets('a{{}}b')).toBe(false);
  });
});

describe('validateLevel', () => {
  const base = {
    id: 'x',
    title: 'X',
    difficulty: 'beginner',
    mobile: true,
    mode: 'html_then_css',
    html: '<h1>Hi</h1>',
    css: 'h1 { color: red; }',
  };

  it('accepts a well-formed level', () => {
    expect(validateLevel(base).ok).toBe(true);
  });

  it('rejects a non-object', () => {
    expect(validateLevel(null).ok).toBe(false);
  });

  it('rejects a missing id', () => {
    expect(validateLevel({ ...base, id: '' }).ok).toBe(false);
  });

  it('rejects an invalid mode', () => {
    expect(validateLevel({ ...base, mode: 'wat' }).ok).toBe(false);
  });

  it('rejects a css_only level with no css', () => {
    const { css, ...noCss } = base;
    expect(validateLevel({ ...noCss, mode: 'css_only' }).ok).toBe(false);
  });

  it('does not require html for a css_only level', () => {
    const { html, ...noHtml } = base;
    expect(validateLevel({ ...noHtml, mode: 'css_only' }).ok).toBe(true);
  });
});

describe('sanitizeLevel', () => {
  it('strips markers and builds the snippet model', () => {
    const level = sanitizeLevel({
      id: 'flex-row',
      title: 'Flex Row',
      difficulty: 'beginner',
      mobile: true,
      mode: 'html_then_css',
      html: '<div class="{{row}}"></div>',
      css: '.row { display: {{flex}}; }',
    });
    expect(level.html).toBe('<div class="row"></div>');
    expect(level.css).toBe('.row { display: flex; }');
    expect(level.snippets.html[0].snippet).toBe('row');
    expect(level.snippets.css[0].snippet).toBe('flex');
  });

  it('returns null for an invalid level', () => {
    spyOn(console, 'warn');
    expect(sanitizeLevel({ id: 'x' })).toBeNull();
  });

  it('defaults an unknown difficulty to beginner', () => {
    spyOn(console, 'warn');
    const level = sanitizeLevel({
      id: 'x', title: 'X', difficulty: 'easy', mobile: false,
      mode: 'css_only', css: 'h1 {}',
    });
    expect(level.difficulty).toBe('beginner');
  });

  it('warns when a mobile level has no snippets', () => {
    spyOn(console, 'warn');
    sanitizeLevel({
      id: 'x', title: 'X', difficulty: 'beginner', mobile: true,
      mode: 'css_only', css: '.box { color: red; }',
    });
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('sanitizePack', () => {
  it('keeps valid levels and drops invalid ones', () => {
    spyOn(console, 'warn');
    const pack = sanitizePack([
      { id: 'good', title: 'Good', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'a {}' },
      { id: 'bad', mode: 'nope' },
    ]);
    expect(pack.length).toBe(1);
    expect(pack[0].id).toBe('good');
  });

  it('returns an empty array for a non-array', () => {
    spyOn(console, 'warn');
    expect(sanitizePack({})).toEqual([]);
  });
});

describe('validateManifest', () => {
  it('keeps valid pack entries', () => {
    const result = validateManifest({
      packs: [{ id: 'beginner', file: 'beginner.json', difficulty: 'beginner' }],
    });
    expect(result.ok).toBe(true);
    expect(result.packs.length).toBe(1);
  });

  it('drops entries missing a file', () => {
    const result = validateManifest({
      packs: [{ id: 'beginner', difficulty: 'beginner' }],
    });
    expect(result.packs.length).toBe(0);
    expect(result.errors.length).toBe(1);
  });

  it('fails when packs is not an array', () => {
    expect(validateManifest({}).ok).toBe(false);
  });
});

describe('filterByDifficulty', () => {
  const levels = [
    { id: 'a', difficulty: 'beginner' },
    { id: 'b', difficulty: 'intermediate' },
  ];

  it('returns only matching levels', () => {
    expect(filterByDifficulty(levels, 'beginner').map((l) => l.id)).toEqual(['a']);
  });

  it('returns all levels for an unknown difficulty', () => {
    expect(filterByDifficulty(levels, 'wat').length).toBe(2);
  });
});

describe('MODES', () => {
  it('lists the three ADR-004 modes', () => {
    expect(MODES).toEqual(['html_only', 'css_only', 'html_then_css']);
  });
});

describe('fetchManifest', () => {
  it('returns validated packs', async () => {
    const packs = await fetchManifest({
      manifestUrl: 'manifest.json',
      fetchImpl: fakeFetch({ packs: [{ id: 'beginner', file: 'beginner.json', difficulty: 'beginner' }] }),
    });
    expect(packs.length).toBe(1);
  });

  it('returns an empty array on a fetch failure', async () => {
    spyOn(console, 'warn');
    const packs = await fetchManifest({
      manifestUrl: 'manifest.json',
      fetchImpl: fakeFetch(null, { ok: false, status: 404 }),
    });
    expect(packs).toEqual([]);
  });
});

describe('fetchPack', () => {
  it('returns runtime levels', async () => {
    const levels = await fetchPack('beginner.json', {
      baseUrl: 'http://localhost/data/prompts/manifest.json',
      fetchImpl: fakeFetch([
        { id: 'a', title: 'A', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'a {}' },
      ]),
    });
    expect(levels.length).toBe(1);
    expect(levels[0].id).toBe('a');
  });

  it('returns an empty array on failure', async () => {
    spyOn(console, 'warn');
    const levels = await fetchPack('beginner.json', {
      baseUrl: 'http://localhost/data/prompts/manifest.json',
      fetchImpl: fakeFetch(null, { ok: false, status: 500 }),
    });
    expect(levels).toEqual([]);
  });
});

describe('loadLevel', () => {
  const manifest = { packs: [{ id: 'beginner', file: 'beginner.json', difficulty: 'beginner' }] };
  const pack = [
    { id: 'first', title: 'First', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'a {}' },
    { id: 'second', title: 'Second', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'b {}' },
  ];

  it('returns the first matching level for a difficulty', async () => {
    const level = await loadLevel({
      difficulty: 'beginner',
      fetchImpl: routedFetch({ 'manifest.json': manifest, 'beginner.json': pack }),
    });
    expect(level.id).toBe('first');
  });

  it('returns a specific level by id', async () => {
    const level = await loadLevel({
      id: 'second',
      fetchImpl: routedFetch({ 'manifest.json': manifest, 'beginner.json': pack }),
    });
    expect(level.id).toBe('second');
  });

  it('returns null when the manifest cannot be loaded', async () => {
    spyOn(console, 'warn');
    const level = await loadLevel({
      difficulty: 'beginner',
      fetchImpl: fakeFetch(null, { ok: false, status: 404 }),
    });
    expect(level).toBeNull();
  });
});

describe('nextLevelId', () => {
  const levels = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('returns the id after the current one', () => {
    expect(nextLevelId(levels, 'a')).toBe('b');
    expect(nextLevelId(levels, 'b')).toBe('c');
  });

  it('returns null for the last level', () => {
    expect(nextLevelId(levels, 'c')).toBeNull();
  });

  it('returns null when the id is not found', () => {
    expect(nextLevelId(levels, 'z')).toBeNull();
  });

  it('returns null for an empty or non-array list', () => {
    expect(nextLevelId([], 'a')).toBeNull();
    expect(nextLevelId(null, 'a')).toBeNull();
  });
});

describe('loadLevels', () => {
  const manifest = {
    packs: [
      { id: 'beginner', file: 'beginner.json', difficulty: 'beginner' },
      { id: 'expert', file: 'expert.json', difficulty: 'expert' },
    ],
  };
  const beginnerPack = [
    { id: 'b1', title: 'B1', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'a {}' },
    { id: 'b2', title: 'B2', difficulty: 'beginner', mobile: false, mode: 'css_only', css: 'b {}' },
  ];
  const expertPack = [
    { id: 'e1', title: 'E1', difficulty: 'expert', mobile: false, mode: 'css_only', css: 'c {}' },
  ];
  const routes = {
    'manifest.json': manifest,
    'beginner.json': beginnerPack,
    'expert.json': expertPack,
  };

  it('returns the ordered levels for a difficulty', async () => {
    const levels = await loadLevels({ difficulty: 'beginner', fetchImpl: routedFetch(routes) });
    expect(levels.map((l) => l.id)).toEqual(['b1', 'b2']);
  });

  it('restricts to a single pack by packId', async () => {
    const levels = await loadLevels({ packId: 'expert', fetchImpl: routedFetch(routes) });
    expect(levels.map((l) => l.id)).toEqual(['e1']);
  });

  it('returns an empty array when the manifest cannot be loaded', async () => {
    spyOn(console, 'warn');
    const levels = await loadLevels({
      difficulty: 'beginner',
      fetchImpl: fakeFetch(null, { ok: false, status: 404 }),
    });
    expect(levels).toEqual([]);
  });
});
