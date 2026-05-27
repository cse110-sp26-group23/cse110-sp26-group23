import { test, expect } from '@playwright/test';

// Types a prompt one character at a time; Enter for newlines.
async function typePrompt(page, text) {
  for (const ch of text) {
    if (ch === '\n') {
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(ch);
    }
  }
}

// beginner-recolor is a css_only level: HTML is given (locked), only CSS is typed.
const RECOLOR_CSS = `.box {
  background: purple;
  color: white;
  padding: 1rem;
}`;

// beginner-heading is an html_only level: only HTML is typed.
const HEADING_HTML = `<h1>Hello, CSE 110!</h1>
<p>Welcome to the typing game.</p>`;

test.describe('mode-aware input pane', () => {
  test('a css_only level locks the HTML tab and completes on CSS alone', async ({ page }) => {
    await page.goto('/game.html?level=beginner-recolor');

    // CSS is the active typed tab; HTML is the locked, pre-filled scaffold.
    await expect(page.locator('.code-pane-tab[data-tab="css"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.code-pane-tab[data-tab="html"]')).toHaveAttribute('data-locked', 'true');

    await typePrompt(page, RECOLOR_CSS);

    // Round completes from the CSS alone, and accuracy reflects only typed CSS.
    const endScreen = page.locator('.end-screen');
    await expect(endScreen).toBeVisible();
    await expect(page.locator('[data-testid="metric-accuracy"]')).toHaveText('100%');
  });
});

test.describe('level progression', () => {
  test('Next Level advances to the following level in the difficulty', async ({ page }) => {
    await page.goto('/game.html?level=beginner-heading');

    // Wait for the input pane to mount (levels load asynchronously) before
    // typing, or early keystrokes are dropped.
    await expect(page.locator('.code-pane-tab[data-tab="html"]')).toHaveAttribute('aria-selected', 'true');

    // html_only: type only the HTML.
    await typePrompt(page, HEADING_HTML);

    const next = page.locator('[data-testid="next-level"]');
    await expect(next).toBeVisible();
    await next.click();

    // The next beginner level after beginner-heading is beginner-recolor.
    await expect(page).toHaveURL(/level=beginner-recolor/);
  });
});

test.describe('landing selection', () => {
  test('choosing a difficulty repopulates levels and Start carries the level id', async ({ page }) => {
    await page.goto('/');

    // Beginner is the default difficulty; its levels are listed by title.
    const levelButtons = page.locator('.level-button');
    await expect(levelButtons.first()).toBeVisible();
    const beginnerCount = await levelButtons.count();
    expect(beginnerCount).toBeGreaterThan(0);

    // Start carries the first level's id by default.
    await expect(page.locator('.start-button')).toHaveAttribute('href', /game\.html\?level=/);

    // Switching difficulty regenerates the list. Wait for the known first
    // intermediate level to appear so we don't read the stale beginner list.
    await page.locator('.difficulty-button[data-difficulty="intermediate"]').click();
    await expect(page.locator('.difficulty-button[data-difficulty="intermediate"]'))
      .toHaveAttribute('aria-pressed', 'true');
    const firstLevel = levelButtons.first();
    await expect(firstLevel).toHaveAttribute('data-level-id', 'intermediate-profile-card');

    // Picking a level updates the Start href to that level.
    const levelId = await firstLevel.getAttribute('data-level-id');
    await firstLevel.click();
    await expect(page.locator('.start-button'))
      .toHaveAttribute('href', `game.html?level=${levelId}`);
  });
});
