/**
 * @file Live in-game updates: progress bar and timer.
 *
 * source/js/game.js writes `progress` (from inputPane's emitChange) into the
 * progress bar's inline width on every keystroke, and source/js/time.js
 * appends 1s ticks to .timer. The end-screen metric assertions live in
 * game-flow.spec.js; this spec covers what changes *during* play.
 */

import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerFlexboxRow;

// Parses the inline width string ("12.3%") into a number for ordering checks.
function widthPercent(style) {
  const match = /([\d.]+)%/.exec(style ?? '');
  return match ? Number(match[1]) : 0;
}

test.describe('in-game progress and timer', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, LEVEL.id);
  });

  test('progress bar fills as the user types correct characters', async ({ page, ui }) => {
    // Starts at 0% before any input.
    const initial = widthPercent(await ui.game.progressFill.getAttribute('style'));
    expect(initial).toBe(0);

    // Type a small prefix of the HTML; progress moves up.
    await typePrompt(page, LEVEL.html.slice(0, 10));
    const afterPrefix = widthPercent(await ui.game.progressFill.getAttribute('style'));
    expect(afterPrefix).toBeGreaterThan(0);
    expect(afterPrefix).toBeLessThan(100);

    // Type more; progress strictly grows.
    await typePrompt(page, LEVEL.html.slice(10, 30));
    const afterMore = widthPercent(await ui.game.progressFill.getAttribute('style'));
    expect(afterMore).toBeGreaterThan(afterPrefix);
  });

  test('timer text matches M:SS and advances after one second', async ({ page, ui }) => {
    // setTimer (source/js/time.js) writes the initial text and ticks every 1s.
    // The format is M:SS (no leading zero on minutes), so "0:01", "0:02", ...
    await expect(ui.game.timer).toHaveText(/^\d+:\d{2}$/);

    const initialText = (await ui.game.timer.textContent()) ?? '';
    // Wait for the displayed text to change (rather than sleeping a fixed
    // duration) so the assertion is not racy under load.
    await page.waitForFunction(
      ([selector, prev]) => document.querySelector(selector)?.textContent !== prev,
      ['.timer', initialText],
      { timeout: 3000 },
    );
    await expect(ui.game.timer).not.toHaveText(initialText);
  });
});
