import { test, expect } from '@playwright/test';

// game.js loads the first beginner level via prompts.js (see
// source/data/prompts/beginner.json -> "beginner-heading"), with snippet
// markers stripped. Prompts are NOT exposed in the DOM, so typing this exact
// content to 100% proves the round is seeded from the loaded level. If that
// level changes, update these strings.
const HTML_PROMPT = `<h1>Hello, CSE 110!</h1>
<p>Welcome to the typing game.</p>`;

const CSS_PROMPT = `h1 { color: #4b2e83; }
p { font-size: 1rem; }`;

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
  test('typing both prompts perfectly reaches the end screen with 100% accuracy', async ({ page }) => {
    await page.goto('/game.html');

    // HTML tab is active first.
    await expect(page.locator('.code-pane-tab[data-tab="html"]')).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, HTML_PROMPT);

    // Auto-advance switches to CSS after ~1s; auto-waiting absorbs the delay.
    await expect(page.locator('.code-pane-tab[data-tab="css"]')).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, CSS_PROMPT);

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
