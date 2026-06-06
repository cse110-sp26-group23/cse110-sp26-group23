/**
 * @file Accessibility smoke coverage.
 *
 * Asserts the landmarks, ARIA roles, and keyboard reachability that the
 * game depends on. Not a full axe scan — those checks are intentional
 * spot-checks of contracts the rest of the suite would silently work
 * around if they regressed.
 */

import { test, expect } from './helpers/fixtures.js';
import { gotoLanding, startLevel, openSettings } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

test.describe('landing page a11y', () => {
  test('exposes one h1 and two h2 section titles', async ({ page, ui }) => {
    await gotoLanding(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(ui.landing.title).toHaveText('codekata');
    await expect(ui.landing.sectionTitles).toHaveCount(2);
  });

  test('Tab keyboard navigation can reach Start, and Enter activates it', async ({ page, ui }) => {
    await gotoLanding(page);
    // Wait for the generated level list so Start has a level id.
    await expect(ui.landing.levelButtons.first()).toBeVisible();

    // Walk forward with Tab until focus lands on the start link. Bound the
    // loop so a regression cannot hang the test.
    const isStartFocused = () =>
      page.evaluate(() => document.activeElement?.classList.contains('start-button'));

    for (let i = 0; i < 30 && !(await isStartFocused()); i += 1) {
      await page.keyboard.press('Tab');
    }
    expect(await isStartFocused()).toBe(true);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/game\.html\?level=/);
  });
});

test.describe('game page a11y', () => {
  test('input-pane tab bar exposes tablist + tab roles', async ({ page, ui }) => {
    await startLevel(page, LEVELS.beginnerNewsletter.id);
    await expect(ui.inputPane.tablist).toHaveAttribute('role', 'tablist');
    await expect(ui.inputPane.htmlTab).toHaveAttribute('role', 'tab');
    await expect(ui.inputPane.cssTab).toHaveAttribute('role', 'tab');
  });

  test('css_only level marks the unused HTML tab aria-disabled', async ({ page, ui }) => {
    await startLevel(page, LEVELS.beginnerSaleBadge.id);
    await expect(ui.inputPane.htmlTab).toHaveAttribute('aria-disabled', 'true');
  });

  test('preview iframe carries a descriptive title', async ({ page, ui }) => {
    await startLevel(page);
    await expect(ui.game.iframe).toHaveAttribute('title', 'Code output preview');
  });

  test('settings overlay declares itself as a modal dialog', async ({ page, ui }) => {
    await startLevel(page);
    await openSettings(page);
    await expect(ui.settings.overlay).toHaveAttribute('role', 'dialog');
    await expect(ui.settings.overlay).toHaveAttribute('aria-modal', 'true');
    await expect(ui.settings.overlay).toHaveAttribute('aria-label', 'Settings');
  });
});
