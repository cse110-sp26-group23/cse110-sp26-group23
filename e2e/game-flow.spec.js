import { test, expect } from '@playwright/test';

// game.js loads levels from source/data/prompts (markers stripped). These flows
// pin specific levels via ?level= so the typed content is deterministic. If the
// referenced levels change, update these strings.

// beginner-flexbox-row (html_then_css): both tabs are typed, html then css.
const FLEX_HTML = `<div class="row">
  <div class="box"></div>
  <div class="box"></div>
  <div class="box"></div>
</div>`;
const FLEX_CSS = `.row { display: flex; gap: 8px; }
.box { width: 40px; height: 40px; background: purple; }`;

// Types a prompt one character at a time against the global keydown handler.
// Newlines map to Enter; everything else (incl. spaces) is typed verbatim.
async function typePrompt(page, text) {
  for (const ch of text) {
    if (ch === '\n') {
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(ch);
    }
  }
}

test.describe('full game flow', () => {
  test('typing an html_then_css level perfectly reaches the end screen with 100% accuracy', async ({ page }) => {
    await page.goto('/game.html?level=beginner-flexbox-row');

    // HTML tab is active first.
    await expect(page.locator('.code-pane-tab[data-tab="html"]')).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, FLEX_HTML);

    // Auto-advance switches to CSS after ~1s; auto-waiting absorbs the delay.
    await expect(page.locator('.code-pane-tab[data-tab="css"]')).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, FLEX_CSS);

    // Completion appends the end-screen overlay.
    const endScreen = page.locator('.end-screen');
    await expect(endScreen).toBeVisible();
    await expect(endScreen.getByText('Round Complete')).toBeVisible();
    await expect(page.locator('[data-testid="metric-accuracy"]')).toHaveText('100%');
    await expect(page.locator('[data-testid="metric-errors"]')).toHaveText('0');
    await expect(page.locator('[data-testid="metric-time"]')).toHaveText(/^\d+\.\d{2}s$/);
    await expect(page.locator('[data-testid="metric-wpm"]')).not.toBeEmpty();
  });
});
