/**
 * @file Keystroke helpers.
 *
 * Every typing action goes through the global keydown handler (see
 * source/js/inputPane.js). Helpers always press one key at a time so the
 * input-pane state machine sees the same event stream a real user produces.
 */

/**
 * Types a string one character at a time. "\n" is mapped to the Enter key
 * because the handler treats Enter as the line break.
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
export async function typePrompt(page, text) {
  for (const ch of text) {
    if (ch === '\n') {
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(ch);
    }
  }
}

/**
 * Types each token in sequence. In snippet (mobile) mode the scaffold
 * between tokens auto-fills, so callers pass only the snippet contents.
 * @param {import('@playwright/test').Page} page
 * @param {ReadonlyArray<string>} tokens
 */
export async function typeTokens(page, tokens) {
  for (const token of tokens) {
    await typePrompt(page, token);
  }
}

/**
 * Presses Backspace n times.
 * @param {import('@playwright/test').Page} page
 * @param {number} [n=1]
 */
export async function backspace(page, n = 1) {
  for (let i = 0; i < n; i += 1) {
    await page.keyboard.press('Backspace');
  }
}
