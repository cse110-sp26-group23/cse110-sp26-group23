/**
 * @file Navigation primitives used across specs.
 *
 * Centralizes the wait-for-pane-mount step so specs that drop straight into
 * a level cannot race the asynchronous level load.
 */

import { locators } from './locators.js';
import { seedSettings } from './settings.js';

/**
 * Navigates to the game landing page (level selector).
 * @param {import('@playwright/test').Page} page
 */
export async function gotoLanding(page) {
  await page.goto('/play.html');
}

/**
 * Loads the game page for a specific level and waits for the input pane to
 * be ready for keystrokes. Optionally seeds settings before the navigation.
 * @param {import('@playwright/test').Page} page
 * @param {string} [levelId] - Level id; omit to let game.js pick the first
 *   level for the active difficulty.
 * @param {object} [options]
 * @param {object} [options.settings] - Partial settings to seed first.
 */
export async function startLevel(page, levelId, { settings } = {}) {
  if (settings) await seedSettings(page, settings);
  const target = levelId
    ? `/game.html?level=${encodeURIComponent(levelId)}`
    : '/game.html';
  await page.goto(target);
  await waitForGameReady(page);
}

/**
 * Resolves once the input pane has mounted and the active tab carries
 * aria-selected="true". Use this before any typing so the first keystroke
 * is never dropped.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForGameReady(page) {
  const ui = locators(page);
  await ui.inputPane.tablist.waitFor();
  await page.locator('.code-pane-tab[aria-selected="true"]').waitFor();
}

/**
 * Opens the settings overlay and waits for it to be visible.
 * @param {import('@playwright/test').Page} page
 */
export async function openSettings(page) {
  const ui = locators(page);
  // Every page now routes settings through the shared navbar gear
  // (`.site-nav-settings`); no page carries its own settings button.
  await ui.game.settingsButton.click();
  await ui.settings.overlay.waitFor();
}

/**
 * Closes the settings overlay via its Exit button and waits for it to be
 * hidden (the source sets the `hidden` attribute, which Playwright treats
 * as the hidden state).
 * @param {import('@playwright/test').Page} page
 */
export async function closeSettings(page) {
  const ui = locators(page);
  await ui.settings.exit.click();
  await ui.settings.overlay.waitFor({ state: 'hidden' });
}
