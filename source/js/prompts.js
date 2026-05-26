/**
 * @file Prompt Library loader.
 *
 * Reads the prompt manifest, fetches level packs, validates and normalizes
 * their contents against the ADR-004 schema, and produces runtime "Level"
 * objects the Game Engine can hand to the Input Pane and Render Pane.
 *
 * Pure helpers (marker stripping, snippet extraction, validation) are exported
 * for unit testing under Node. The async I/O functions (fetchManifest,
 * fetchPack, loadLevel) accept an injectable fetch implementation so they can
 * be unit-tested without a network, and are otherwise exercised by E2E tests.
 *
 * Per ADR-004 the schema's `difficulty` values use the settings vocabulary
 * (beginner/intermediate/expert); DIFFICULTIES is reused from settings.js so
 * the loader and settings share one source of truth.
 */

import { DIFFICULTIES } from './settings.js';

/**
 * Allowed level modes: which portion of the page the player types.
 * @readonly
 * @type {ReadonlyArray<string>}
 */
export const MODES = Object.freeze(['html_only', 'css_only', 'html_then_css']);

/**
 * Location of the manifest relative to this module. Resolved against
 * import.meta.url at fetch time so it works regardless of which page loads it.
 * @type {string}
 */
const DEFAULT_MANIFEST_PATH = '../data/prompts/manifest.json';

// Emits a namespaced warning without throwing, so bad data degrades the level
// list rather than crashing the game. Guarded so it is safe in any environment.
function warn(message) {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[prompts] ${message}`);
  }
}

function modeUsesHtml(mode) {
  return mode === 'html_only' || mode === 'html_then_css';
}

function modeUsesCss(mode) {
  return mode === 'css_only' || mode === 'html_then_css';
}

// ─── PURE: MARKERS ─────────────────────────────────────────────────────────────

/**
 * Removes `{{ }}` snippet delimiters from a level's html/css, keeping the inner
 * text in place. `<div class="{{row}}">` becomes `<div class="row">`. Operates
 * per line, so an unbalanced `{{` with no closing `}}` on the same line is left
 * untouched rather than swallowing the rest of the text (ADR-004: markers never
 * cross a line boundary).
 * @param {string} text - Raw html or css, possibly containing markers
 * @returns {string} The text with all balanced markers stripped
 */
export function stripMarkers(text) {
  if (typeof text !== 'string') return '';
  return text
    .split('\n')
    .map((line) => line.replace(/\{\{([\s\S]*?)\}\}/g, '$1'))
    .join('\n');
}

/**
 * Builds the per-line snippet model used for mobile gameplay. Each entry is the
 * marker-stripped `scaffold` line plus the `snippet` the mobile player types on
 * that line (or null when the line has no valid single marker). Enforces the
 * one-snippet-per-line rule: if a line carries more than one marker the first
 * wins and a warning is emitted; the scaffold still strips every marker.
 * @param {string} text - Raw html or css, possibly containing markers
 * @returns {Array<{line: number, snippet: (string|null), scaffold: string}>}
 */
export function extractSnippets(text) {
  const source = typeof text === 'string' ? text : '';
  return source.split('\n').map((line, index) => {
    const scaffold = stripMarkers(line);
    const open = line.indexOf('{{');
    if (open === -1) {
      return { line: index, snippet: null, scaffold };
    }
    const close = line.indexOf('}}', open + 2);
    if (close === -1) {
      // Opening marker with no close on this line: malformed, treat as no snippet.
      return { line: index, snippet: null, scaffold };
    }
    if (line.indexOf('{{', close + 2) !== -1) {
      warn(`multiple snippet markers on one line, using the first: ${line.trim()}`);
    }
    return { line: index, snippet: line.slice(open + 2, close), scaffold };
  });
}

/**
 * Reports whether the given html/css contains at least one usable snippet.
 * Empty markers (`{{}}`) and whitespace-only snippets do not count.
 * @param {string} text - Raw html or css
 * @returns {boolean} True if a non-empty snippet is present
 */
export function hasSnippets(text) {
  return extractSnippets(text).some(
    (entry) => entry.snippet !== null && entry.snippet.trim() !== '',
  );
}

// ─── PURE: VALIDATION ──────────────────────────────────────────────────────────

/**
 * Validates a raw level object against the required ADR-004 fields without
 * throwing. Difficulty is not a drop reason (it is defaulted in sanitizeLevel);
 * an unknown or missing `mode`, or a missing required `html`/`css` for the mode,
 * makes the level invalid.
 * @param {*} raw - A parsed level object from a pack array
 * @returns {{ok: boolean, errors: string[], level: (object|null)}}
 */
export function validateLevel(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['level is not an object'], level: null };
  }

  const errors = [];
  const id = typeof raw.id === 'string' ? raw.id : '?';

  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    errors.push('level is missing a valid "id"');
  }
  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    errors.push(`level "${id}" is missing a valid "title"`);
  }
  if (!MODES.includes(raw.mode)) {
    errors.push(`level "${id}" has missing or invalid "mode"`);
  } else {
    if (modeUsesHtml(raw.mode) && typeof raw.html !== 'string') {
      errors.push(`level "${id}" mode "${raw.mode}" requires a string "html"`);
    }
    if (modeUsesCss(raw.mode) && typeof raw.css !== 'string') {
      errors.push(`level "${id}" mode "${raw.mode}" requires a string "css"`);
    }
  }
  // html/css feed the Render Pane regardless of mode, so any present value must
  // still be a string.
  if (raw.html !== undefined && typeof raw.html !== 'string') {
    errors.push(`level "${id}" has a non-string "html"`);
  }
  if (raw.css !== undefined && typeof raw.css !== 'string') {
    errors.push(`level "${id}" has a non-string "css"`);
  }

  return { ok: errors.length === 0, errors, level: errors.length === 0 ? raw : null };
}

/**
 * Normalizes a raw level into a runtime Level object, or returns null if the
 * level is invalid. Strips markers from html/css, builds the per-line snippet
 * model, defaults an unknown difficulty to "beginner", and warns when a level
 * marked mobile has no snippets to play (ADR-004).
 * @param {*} raw - A parsed level object
 * @returns {object|null} A runtime Level, or null when invalid
 */
export function sanitizeLevel(raw) {
  const { ok, errors } = validateLevel(raw);
  if (!ok) {
    errors.forEach(warn);
    return null;
  }

  const difficulty = DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : 'beginner';
  if (!DIFFICULTIES.includes(raw.difficulty)) {
    warn(`level "${raw.id}" has unknown difficulty "${raw.difficulty}", defaulting to "beginner"`);
  }

  const mobile = raw.mobile === true;
  const rawHtml = typeof raw.html === 'string' ? raw.html : '';
  const rawCss = typeof raw.css === 'string' ? raw.css : '';

  if (mobile && !hasSnippets(rawHtml) && !hasSnippets(rawCss)) {
    warn(`level "${raw.id}" is marked mobile but has no snippets`);
  }

  return {
    id: raw.id,
    title: raw.title,
    difficulty,
    mode: raw.mode,
    mobile,
    html: stripMarkers(rawHtml),
    css: stripMarkers(rawCss),
    snippets: {
      html: extractSnippets(rawHtml),
      css: extractSnippets(rawCss),
    },
  };
}

/**
 * Normalizes a raw pack (an array of levels) into runtime Level objects.
 * Invalid levels are dropped individually so one bad entry does not discard a
 * whole pack; a non-array pack yields an empty list.
 * @param {*} raw - A parsed pack file
 * @returns {object[]} Runtime Level objects
 */
export function sanitizePack(raw) {
  if (!Array.isArray(raw)) {
    warn('pack is not an array, ignoring');
    return [];
  }
  const levels = [];
  raw.forEach((entry) => {
    const level = sanitizeLevel(entry);
    if (level) levels.push(level);
  });
  return levels;
}

/**
 * Validates the manifest without throwing. Malformed pack entries are dropped
 * and reported in `errors`; the manifest as a whole is only invalid when it is
 * not an object with a `packs` array.
 * @param {*} raw - A parsed manifest object
 * @returns {{ok: boolean, errors: string[], packs: Array<{id: string, file: string, difficulty: string}>}}
 */
export function validateManifest(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.packs)) {
    return { ok: false, errors: ['manifest must be an object with a "packs" array'], packs: [] };
  }

  const errors = [];
  const packs = [];
  raw.packs.forEach((pack, i) => {
    const valid =
      pack && typeof pack === 'object' &&
      typeof pack.id === 'string' && pack.id.trim() !== '' &&
      typeof pack.file === 'string' && pack.file.trim() !== '' &&
      typeof pack.difficulty === 'string';
    if (valid) {
      packs.push({ id: pack.id, file: pack.file, difficulty: pack.difficulty });
    } else {
      errors.push(`manifest pack #${i} is invalid, dropping it`);
    }
  });

  return { ok: true, errors, packs };
}

/**
 * Filters levels to those matching the given difficulty. A falsy or unknown
 * difficulty returns all levels unfiltered.
 * @param {object[]} levels - Runtime Level objects
 * @param {string} difficulty - One of DIFFICULTIES
 * @returns {object[]} The matching levels
 */
export function filterByDifficulty(levels, difficulty) {
  if (!Array.isArray(levels)) return [];
  if (!difficulty || !DIFFICULTIES.includes(difficulty)) return levels.slice();
  return levels.filter((level) => level.difficulty === difficulty);
}

/**
 * Returns the id of the level after `currentId` in the given ordered list, used
 * to power "Next Level" progression. Returns null when `currentId` is the last
 * level, is not found, or the list is empty/invalid.
 * @param {object[]} levels - Ordered runtime Level objects
 * @param {string} currentId - The id of the current level
 * @returns {string|null} The next level's id, or null
 */
export function nextLevelId(levels, currentId) {
  if (!Array.isArray(levels)) return null;
  const index = levels.findIndex((level) => level && level.id === currentId);
  if (index === -1 || index + 1 >= levels.length) return null;
  return levels[index + 1].id;
}

// ─── ASYNC: I/O ────────────────────────────────────────────────────────────────

// Fetches and parses JSON, returning null (after a warning) on any failure so
// callers can degrade gracefully. fetchImpl is injectable for testing.
async function fetchJson(url, fetchImpl) {
  const doFetch = typeof fetchImpl === 'function' ? fetchImpl : globalThis.fetch;
  if (typeof doFetch !== 'function') {
    warn('no fetch implementation available');
    return null;
  }
  try {
    const res = await doFetch(url);
    if (!res || !res.ok) {
      warn(`failed to fetch ${url}: ${res ? res.status : 'no response'}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    warn(`error fetching ${url}: ${err && err.message ? err.message : err}`);
    return null;
  }
}

/**
 * Fetches and validates the pack manifest.
 * @param {object} [options]
 * @param {function} [options.fetchImpl] - Fetch implementation (defaults to globalThis.fetch)
 * @param {(string|URL)} [options.manifestUrl] - Override the manifest URL (for tests)
 * @returns {Promise<Array<{id: string, file: string, difficulty: string}>>}
 *   The registered packs, or an empty array on any failure.
 */
export async function fetchManifest({ fetchImpl, manifestUrl } = {}) {
  const url = manifestUrl ?? new URL(DEFAULT_MANIFEST_PATH, import.meta.url);
  const json = await fetchJson(url, fetchImpl);
  if (json === null) return [];
  const { packs, errors } = validateManifest(json);
  errors.forEach(warn);
  return packs;
}

/**
 * Fetches a single pack file and returns its runtime Level objects.
 * @param {string} file - The pack filename from the manifest
 * @param {object} [options]
 * @param {function} [options.fetchImpl] - Fetch implementation (defaults to globalThis.fetch)
 * @param {(string|URL)} [options.baseUrl] - Base URL the pack file resolves against
 * @returns {Promise<object[]>} Runtime Level objects, or an empty array on failure.
 */
export async function fetchPack(file, { fetchImpl, baseUrl } = {}) {
  if (typeof file !== 'string' || file.trim() === '') {
    warn('fetchPack requires a file name');
    return [];
  }
  const base = baseUrl ?? new URL(DEFAULT_MANIFEST_PATH, import.meta.url);
  let url;
  try {
    url = new URL(file, base);
  } catch {
    url = file;
  }
  const json = await fetchJson(url, fetchImpl);
  if (json === null) return [];
  return sanitizePack(json);
}

/**
 * Loads all usable levels for a difficulty (or a specific pack), in order.
 * Reads the manifest, picks the pack(s) to search, fetches and normalizes each,
 * and concatenates their levels preserving manifest pack order then in-pack
 * order. Pack selection: `packId` restricts to one pack; otherwise packs whose
 * manifest difficulty matches (falling back to every pack if none match). Each
 * pack's levels are additionally filtered by the level's own difficulty, so a
 * mixed pack still yields only matching levels.
 * @param {object} [options]
 * @param {string} [options.difficulty] - Difficulty to filter by (settings vocab)
 * @param {string} [options.packId] - Restrict the search to a single pack
 * @param {function} [options.fetchImpl] - Fetch implementation (defaults to globalThis.fetch)
 * @returns {Promise<object[]>} Ordered runtime Level objects, possibly empty.
 */
export async function loadLevels({ difficulty, packId, fetchImpl } = {}) {
  const manifestUrl = new URL(DEFAULT_MANIFEST_PATH, import.meta.url);
  const packs = await fetchManifest({ fetchImpl, manifestUrl });
  if (packs.length === 0) return [];

  let candidatePacks = packs;
  if (packId) {
    candidatePacks = packs.filter((pack) => pack.id === packId);
  } else if (difficulty && DIFFICULTIES.includes(difficulty)) {
    const matching = packs.filter((pack) => pack.difficulty === difficulty);
    candidatePacks = matching.length > 0 ? matching : packs;
  }

  const out = [];
  for (const pack of candidatePacks) {
    const levels = await fetchPack(pack.file, { fetchImpl, baseUrl: manifestUrl });
    filterByDifficulty(levels, difficulty).forEach((level) => out.push(level));
  }
  return out;
}

/**
 * Loads a single usable level. Selection precedence: explicit `id` > first
 * level matching `packId`/`difficulty`. Returns null when nothing is found.
 * @param {object} [options]
 * @param {string} [options.difficulty] - Difficulty to filter by (settings vocab)
 * @param {string} [options.id] - A specific level id to load
 * @param {string} [options.packId] - Restrict the search to a single pack
 * @param {function} [options.fetchImpl] - Fetch implementation (defaults to globalThis.fetch)
 * @returns {Promise<object|null>} A runtime Level, or null when none is found.
 */
export async function loadLevel({ difficulty, id, packId, fetchImpl } = {}) {
  const levels = await loadLevels({ difficulty, packId, fetchImpl });
  if (levels.length === 0) return null;
  if (id) return levels.find((level) => level.id === id) ?? null;
  return levels[0];
}
