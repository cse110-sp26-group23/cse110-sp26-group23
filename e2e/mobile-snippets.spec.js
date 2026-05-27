import { test, expect } from '@playwright/test';

// Mirrors the settings storage key in source/js/settings.js.
const SETTINGS_KEY = 'cse110-typing-game/settings';

// The snippet tokens (the {{...}} contents) of beginner-flexbox-row in
// source/data/prompts/beginner.json, in typing order. On mobile these are the
// only characters the player types; everything else auto-fills. The level is
// pinned via ?level= so the typed content is deterministic; keep in sync with
// that level if it changes.
const HTML_SNIPPETS = ['row', 'box', 'box', 'box'];
const CSS_SNIPPETS = ['flex', 'purple'];

// Seeds persisted settings before any page script runs, so the game boots
// straight into the given view mode.
async function seedViewMode(page, viewMode) {
  await page.addInitScript(
    ([key, mode]) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          colorScheme: 'dark',
          audioEnabled: true,
          volume: 0.5,
          difficulty: 'beginner',
          theme: 'default',
          viewMode: mode,
        }),
      );
    },
    [SETTINGS_KEY, viewMode],
  );
}

// Types each token one character at a time. Scaffold between tokens auto-fills
// in snippet mode, so no separators are needed.
async function typeTokens(page, tokens) {
  for (const token of tokens) {
    for (const ch of token) {
      await page.keyboard.type(ch);
    }
  }
}

test.describe('mobile snippet mode', () => {
  test('typing only the snippet tokens completes the round at 100% accuracy', async ({ page }) => {
    await seedViewMode(page, 'mobile');
    await page.goto('/game.html?level=beginner-flexbox-row');

    await expect(page.locator('html')).toHaveAttribute('data-view-mode', 'mobile');
    // Auto-filled scaffold is marked, confirming the pane is in snippet mode.
    await expect(page.locator('.code-pane .char-scaffold').first()).toBeVisible();

    await typeTokens(page, HTML_SNIPPETS);

    // Auto-advance flips to the CSS tab once the HTML snippets are done.
    await expect(page.locator('.code-pane-tab[data-tab="css"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await typeTokens(page, CSS_SNIPPETS);

    const endScreen = page.locator('.end-screen');
    await expect(endScreen).toBeVisible();
    await expect(endScreen.getByText('Round Complete')).toBeVisible();
    await expect(page.locator('[data-testid="metric-accuracy"]')).toHaveText('100%');
    await expect(page.locator('[data-testid="metric-errors"]')).toHaveText('0');
  });

  test('toggling the View setting switches in and out of snippet mode', async ({ page }) => {
    await page.goto('/game.html'); // desktop is the default view

    const pane = page.locator('.code-pane');
    await expect(page.locator('html')).toHaveAttribute('data-view-mode', 'desktop');
    await expect(pane.locator('.char-scaffold')).toHaveCount(0);

    // Desktop -> Mobile via the settings overlay.
    await page.locator('.settings-button').click();
    await page.getByRole('button', { name: /^View:/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-view-mode', 'mobile');
    await page.locator('.settings-exit').click();

    // Snippet mode is now active: scaffold is auto-filled.
    await expect(pane.locator('.char-scaffold').first()).toBeVisible();

    // Mobile -> Desktop and confirm snippet mode is gone.
    await page.locator('.settings-button').click();
    await page.getByRole('button', { name: /^View:/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-view-mode', 'desktop');
    await page.locator('.settings-exit').click();
    await expect(pane.locator('.char-scaffold')).toHaveCount(0);
  });
});
