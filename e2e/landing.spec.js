import { test, expect } from '@playwright/test';

// Smoke coverage for index.html. Selectors mirror index.html exactly.
test.describe('landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the title and core controls', async ({ page }) => {
    await expect(page.locator('.game-title')).toHaveText('Codekata');
    await expect(page.locator('.difficulty-button')).toHaveCount(3);
    // Level buttons are generated from the prompt manifest for the current
    // difficulty, so there is at least one rather than a fixed count.
    await expect(page.locator('.level-button').first()).toBeVisible();
    await expect(page.locator('.start-button')).toBeVisible();
    await expect(page.locator('.settings-button')).toBeVisible();
  });

  test('Start navigates to the game screen with a level id', async ({ page }) => {
    // Wait for the generated levels so Start has carried a level id.
    await expect(page.locator('.level-button').first()).toBeVisible();
    await page.locator('.start-button').click();
    await expect(page).toHaveURL(/game\.html\?level=/);
    await expect(page.locator('iframe.render-pane-iframe')).toBeVisible();
    await expect(page.locator('.timer')).toBeVisible();
  });
});
