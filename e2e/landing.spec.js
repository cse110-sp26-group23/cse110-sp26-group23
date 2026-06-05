import { test, expect } from './helpers/fixtures.js';
import { gotoLanding, openSettings, closeSettings, readStoredSettings } from './helpers/index.js';

// Smoke coverage for index.html.
test.describe('landing page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLanding(page);
  });

  test('shows the title and core controls', async ({ ui }) => {
    await expect(ui.landing.title).toHaveText('Codekata');
    await expect(ui.landing.difficultyButtons).toHaveCount(3);
    // Level buttons are generated from the prompt manifest for the current
    // difficulty, so there is at least one rather than a fixed count.
    await expect(ui.landing.levelButtons.first()).toBeVisible();
    await expect(ui.landing.start).toBeVisible();
    await expect(ui.landing.settingsButton).toBeVisible();
  });

  test('Start navigates to the game screen with a level id', async ({ page, ui }) => {
    // Wait for the generated levels so Start has carried a level id.
    await expect(ui.landing.levelButtons.first()).toBeVisible();
    await ui.landing.start.click();
    await expect(page).toHaveURL(/game\.html\?level=/);
    await expect(ui.game.iframe).toBeVisible();
    await expect(ui.game.timer).toBeVisible();
  });

  test('view mode cycles auto -> desktop -> mobile -> auto', async ({ page, ui }) => {
    // Fresh load with no seeded settings: auto-detect is on, and the headless
    // desktop browser detects the desktop layout.
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');

    await openSettings(page);
    await expect(ui.settings.viewButton).toHaveText('auto');

    // auto -> desktop: a manual pick turns auto-detect off.
    await ui.settings.viewButton.click();
    await expect(ui.settings.viewButton).toHaveText('desktop');
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
    expect(await readStoredSettings(page)).toMatchObject({ autoViewMode: false, viewMode: 'desktop' });

    // desktop -> mobile.
    await ui.settings.viewButton.click();
    await expect(ui.settings.viewButton).toHaveText('mobile');
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');
    expect(await readStoredSettings(page)).toMatchObject({ autoViewMode: false, viewMode: 'mobile' });

    // mobile -> auto: detection re-enabled, layout snaps back to the detected
    // desktop mode while the stored manual viewMode is left untouched.
    await ui.settings.viewButton.click();
    await expect(ui.settings.viewButton).toHaveText('auto');
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
    expect(await readStoredSettings(page)).toMatchObject({ autoViewMode: true });

    await closeSettings(page);
  });

  test('auto-detect boots into mobile on a narrow viewport', async ({ page, ui }) => {
    // No seeded settings, so auto-detect is on. A viewport at/under the mobile
    // breakpoint should resolve to the mobile layout before first paint.
    await page.setViewportSize({ width: 400, height: 800 });
    await page.reload();
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');
  });

  test('auto-detect live-switches the landing layout on viewport resize', async ({ page, ui }) => {
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');

    // Crossing the breakpoint flips the layout while auto-detect is on,
    // without a reload (matchMedia change listener).
    await page.setViewportSize({ width: 400, height: 800 });
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
  });
});
