/**
 * @file Theme + color-scheme cycling through the settings overlay.
 *
 * source/js/settings.js applies settings by setting data-color-scheme and
 * data-theme on <html>. We assert against those attributes (load-bearing
 * per applySettings) rather than computed colors, which can vary as
 * theme.css evolves.
 */

import { test, expect } from './helpers/fixtures.js';
import {
  startLevel,
  openSettings,
  closeSettings,
  readStoredSettings,
  THEMES,
} from './helpers/index.js';

test.describe('color scheme + theme toggles', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page);
  });

  test('Mode button flips between dark and light', async ({ page, ui }) => {
    await expect(ui.htmlRoot).toHaveAttribute('data-color-scheme', 'dark');

    await openSettings(page);
    await ui.settings.modeButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-color-scheme', 'light');
    await expect(ui.settings.modeButton).toHaveText('Mode: Light');
    await expect(ui.settings.modeButton).toHaveAttribute('aria-pressed', 'true');

    await ui.settings.modeButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-color-scheme', 'dark');
    await expect(ui.settings.modeButton).toHaveAttribute('aria-pressed', 'false');
    await closeSettings(page);
  });

  test('Theme button cycles through every theme in order', async ({ page, ui }) => {
    await openSettings(page);

    // Start from the default; one click should advance to the next theme,
    // and after THEMES.length clicks we are back at the start.
    await expect(ui.htmlRoot).toHaveAttribute('data-theme', THEMES[0]);
    for (let i = 1; i < THEMES.length; i += 1) {
      await ui.settings.themeButton.click();
      await expect(ui.htmlRoot).toHaveAttribute('data-theme', THEMES[i]);
    }
    await ui.settings.themeButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-theme', THEMES[0]);
  });

  test('selections persist across reload via localStorage', async ({ page, ui }) => {
    await openSettings(page);
    await ui.settings.modeButton.click(); // dark -> light
    await ui.settings.themeButton.click(); // default -> yellow
    await closeSettings(page);

    // Storage reflects the change immediately (updateSettings is synchronous).
    const stored = await readStoredSettings(page);
    expect(stored).toMatchObject({ colorScheme: 'light', theme: 'yellow' });

    // After a reload the attributes are re-applied from the persisted state.
    await page.reload();
    await expect(ui.htmlRoot).toHaveAttribute('data-color-scheme', 'light');
    await expect(ui.htmlRoot).toHaveAttribute('data-theme', 'yellow');
  });
});
