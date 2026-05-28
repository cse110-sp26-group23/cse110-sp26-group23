/**
 * @file Error-highlight coverage for source/js/inputPane.js.
 *
 * inputPane.js applies `char-incorrect` to a typed character that doesn't
 * match the prompt, and locks further input (except Backspace) until the
 * mistake is cleared. Because input is blocked after the first mistake,
 * at most one trailing wrong character can exist at a time.
 */

import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt, backspace, SEL } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerFlexboxRow;
const CORRECT_PREFIX = '<div'; // First four characters of the HTML prompt.

test.describe('input-pane error highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, LEVEL.id);
  });

  test('typing a wrong character marks the slot incorrect and blocks further input', async ({ page, ui }) => {
    await typePrompt(page, CORRECT_PREFIX);

    // Sanity: the correct prefix is reflected as four correct spans.
    await expect(ui.inputPane.correctChars).toHaveCount(CORRECT_PREFIX.length);

    // Mistype the next character. The expected char is ' '; press 'X' instead.
    await page.keyboard.type('X');

    // The incorrect slot is the one immediately after the correct prefix,
    // and renders the actually-typed character (per compareText in inputPane.js).
    const incorrectSpan = ui.inputPane.promptChars.nth(CORRECT_PREFIX.length);
    await expect(incorrectSpan).toHaveClass(new RegExp(`\\b${SEL.charClass.incorrect}\\b`));
    await expect(incorrectSpan).toHaveText('X');

    // Further input is blocked until the mistake is cleared: typing more
    // correct characters does NOT extend the correct count.
    await page.keyboard.type(' class');
    await expect(ui.inputPane.correctChars).toHaveCount(CORRECT_PREFIX.length);

    // The incorrect span is still the only incorrect one (no stacking).
    await expect(ui.inputPane.incorrectChars).toHaveCount(1);
  });

  test('Backspace clears the wrong character and typing can resume', async ({ page, ui }) => {
    await typePrompt(page, CORRECT_PREFIX);
    await page.keyboard.type('X');

    // Backspace removes the bad character; the slot returns to pending.
    await backspace(page);
    await expect(ui.inputPane.incorrectChars).toHaveCount(0);

    // The correct character now extends the correct prefix.
    await page.keyboard.type(' ');
    await expect(ui.inputPane.correctChars).toHaveCount(CORRECT_PREFIX.length + 1);
  });
});
