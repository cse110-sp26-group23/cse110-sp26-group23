import { test, expect } from '@playwright/test';

// Smoke coverage for index.html. Selectors mirror index.html exactly.
test.describe('landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the title and core controls', async ({ page }) => {
    await expect(page.locator('.game-title')).toHaveText('Codekata');
    await expect(page.locator('.difficulty-button')).toHaveCount(3);
    await expect(page.locator('.level-button')).toHaveCount(6);
    await expect(page.locator('.start-button')).toBeVisible();
    await expect(page.locator('.settings-button')).toBeVisible();
  });

  test('Start navigates to the game screen', async ({ page }) => {
    await page.locator('.start-button').click();
    await expect(page).toHaveURL(/game\.html$/);
    await expect(page.locator('iframe.render-pane-iframe')).toBeVisible();
    await expect(page.locator('.timer')).toBeVisible();
  });
});
