/**
 * @file Settings overlay end-to-end: the Audio toggle and the volume control
 * round-trip through localStorage, Restart resets in-game progress, and a
 * reload re-reads each value from storage.
 *
 * Theme + color-scheme cycling has dedicated coverage in theme-toggle.spec.js,
 * and view-mode toggling is covered by the landing-page tests.
 */

import { test, expect } from './helpers/fixtures.js';
import {
  startLevel,
  openSettings,
  closeSettings,
  typePrompt,
  readStoredSettings,
} from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerFlexboxRow;

test.describe('settings overlay controls', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page, LEVEL.id);
  });

  test('toggle, cycle, and slider controls each round-trip through localStorage', async ({ page, ui }) => {
    await openSettings(page);

    // Audio is a toggle (boolean + aria-pressed).
    await expect(ui.settings.audioButton).toHaveAttribute('aria-pressed', 'true');
    await expect(ui.settings.audioButton).toHaveText('Audio: On');
    await ui.settings.audioButton.click();
    await expect(ui.settings.audioButton).toHaveAttribute('aria-pressed', 'false');
    await expect(ui.settings.audioButton).toHaveText('Audio: Off');

    // Volume is an editable contenteditable inside `<audio volume="N" />`.
    // Replace its digits by selecting all and typing the new value; the
    // input handler clamps to 0..100 and commits volume as N/100 to
    // localStorage on every keystroke.
    await ui.settings.volume.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('25');

    const stored = await readStoredSettings(page);
    expect(stored).toMatchObject({
      audioEnabled: false,
      volume: 0.25,
    });
  });

  test('settings survive a reload and re-render with the stored values', async ({ page, ui }) => {
    await openSettings(page);
    await ui.settings.audioButton.click(); // On -> Off
    await closeSettings(page);

    await page.reload();
    await openSettings(page);
    await expect(ui.settings.audioButton).toHaveText('Audio: Off');
    await expect(ui.settings.audioButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('Restart Level closes the overlay and resets the progress bar to 0%', async ({ page, ui }) => {
    // Type enough to push the progress bar above zero.
    await typePrompt(page, LEVEL.html.slice(0, 20));
    const beforeStyle = await ui.game.progressFill.getAttribute('style');
    expect(beforeStyle).toMatch(/width:\s*[1-9]/);

    await openSettings(page);
    await ui.settings.restartButton.click();

    await expect(ui.settings.overlay).toBeHidden();
    await expect(ui.game.progressFill).toHaveAttribute('style', /width:\s*0(\.0+)?%/);
  });
});

