/**
 * @file Snippet markers for mobile prompts.
 *
 * Pure parsing of the inline `{{...}}` snippet syntax defined in
 * ADR-004 (docs/decisions/004-json-prompt-schema.md). A snippet is the
 * "interesting" token on a line — the part the level is teaching. On
 * mobile the player types only the snippet text; the surrounding
 * scaffold (brackets, quotes, punctuation, whitespace) auto-fills. On
 * desktop the markers are stripped and the full content is typed.
 *
 * No DOM access here, so this module is unit-tested with Jasmine. The
 * input pane consumes the parsed output to drive the typing flow.
 */

/** Opening snippet delimiter. */
export const SNIPPET_OPEN = '{{';

/** Closing snippet delimiter. */
export const SNIPPET_CLOSE = '}}';

/**
 * Parses a prompt string containing optional `{{...}}` snippet markers.
 *
 * Returns the display text with all delimiters stripped, plus a boolean
 * mask with one entry per character of that text: `true` where the
 * character belongs to a snippet (the mobile player types it) and
 * `false` where it is scaffold (auto-filled on mobile, typed normally
 * on desktop). `text.length === mask.length` always holds.
 *
 * Markers never cross line boundaries (ADR-004). An unclosed `{{` on a
 * line is treated as literal text so a malformed prompt still plays as
 * an all-scaffold line rather than throwing.
 *
 * @param {string} marked - Prompt text, possibly containing `{{...}}` markers
 * @returns {{ text: string, mask: boolean[] }} Stripped text and per-character snippet mask
 */
export function parsePrompt(marked) {
  const src = typeof marked === 'string' ? marked : '';
  const out = [];
  const mask = [];

  const pushChar = (ch, isSnippet) => {
    out.push(ch);
    mask.push(isSnippet);
  };

  const lines = src.split('\n');
  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) pushChar('\n', false);

    let i = 0;
    while (i < line.length) {
      if (line.startsWith(SNIPPET_OPEN, i)) {
        // A marker is only honored if it closes on the same line.
        const close = line.indexOf(SNIPPET_CLOSE, i + SNIPPET_OPEN.length);
        if (close !== -1) {
          const inner = line.slice(i + SNIPPET_OPEN.length, close);
          for (let k = 0; k < inner.length; k += 1) {
            pushChar(inner[k], true);
          }
          i = close + SNIPPET_CLOSE.length;
          continue;
        }
      }
      pushChar(line[i], false);
      i += 1;
    }
  });

  return { text: out.join(''), mask };
}

/**
 * Returns the prompt text with all snippet delimiters removed — the
 * desktop view of the prompt, where the player types the full content.
 *
 * @param {string} marked - Prompt text, possibly containing `{{...}}` markers
 * @returns {string} Display text with `{{` and `}}` stripped
 */
export function stripMarkers(marked) {
  return parsePrompt(marked).text;
}

/**
 * Reports whether a prompt declares at least one snippet.
 *
 * The loader uses this to warn when a level is marked mobile-playable
 * but has no snippets (ADR-004), which would leave a mobile player with
 * nothing to type.
 *
 * @param {string} marked - Prompt text, possibly containing `{{...}}` markers
 * @returns {boolean} True if any character is part of a snippet
 */
export function hasSnippets(marked) {
  return parsePrompt(marked).mask.some(Boolean);
}

/**
 * Extracts the distinct snippet token strings from a marked prompt.
 * Consecutive characters where mask[i] === true are collapsed into one token.
 *
 * @param {string} marked - Prompt text, possibly containing `{{...}}` markers
 * @returns {string[]} Ordered array of snippet token strings
 */
export function extractTokens(marked) {
  const { text, mask } = parsePrompt(marked);
  const tokens = [];
  let i = 0;
  while (i < mask.length) {
    if (mask[i]) {
      let token = '';
      while (i < mask.length && mask[i]) {
        token += text[i];
        i += 1;
      }
      tokens.push(token);
    } else {
      i += 1;
    }
  }
  return tokens;
}


