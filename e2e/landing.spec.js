import { test, expect } from './helpers/fixtures.js';
import { gotoLanding, openSettings, closeSettings } from './helpers/index.js';

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

  test('view mode toggle switches between desktop and mobile', async ({ page, ui }) => {
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');

    await openSettings(page);
    await ui.settings.viewButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');

    await ui.settings.viewButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');

    await closeSettings(page);
  });
});
