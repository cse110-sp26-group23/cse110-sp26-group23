import { test, expect } from '@playwright/test';

// Prompts are NOT exposed in the DOM. Keep these in sync with DEFAULT_PROMPTS
// in source/js/inputPane.js. If that default changes, update these strings.
const HTML_PROMPT = `<section class="preview-card">
  <h1>Hello, CSE 110!</h1>
  <p>This preview is rendered from a combined HTML/CSS string.</p>
  <button>Example Button</button>
</section>`;

const CSS_PROMPT = `.preview-card {
  border: 2px solid #333;
  border-radius: 12px;
  padding: 1rem;
  max-width: 320px;
}

.preview-card h1 {
  margin-top: 0;
  font-size: 1.5rem;
}

.preview-card button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}`;

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
