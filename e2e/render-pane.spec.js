import { test, expect } from '@playwright/test';

// renderPane.js writes the typed HTML/CSS into a sandboxed iframe's LIVE
// document on every keystroke (doc.open/write/close). jsdom can't exercise
// iframe content-document semantics, so this lives here.
//
// On game.html load the input pane immediately renders the (empty) typed
// content, overwriting initRenderPane's hardcoded sample. So we drive the real
// behavior: type a correct prefix of the HTML prompt and assert it renders.
// This prefix must match the start of DEFAULT_PROMPTS.html in
// source/js/inputPane.js; update it if that default changes.
const HTML_PREFIX = `<section class="preview-card">
  <h1>Hello, CSE 110!</h1>`;

async function typeText(page, text) {
  for (const ch of text) {
    if (ch === '\n') {
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(ch);
    }
  }
}

test.describe('render pane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game.html');
  });

  test('creates the sandboxed preview iframe', async ({ page }) => {
    const iframe = page.locator('iframe.render-pane-iframe');
    await expect(iframe).toHaveAttribute('title', 'Code output preview');
    await expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin');
  });

  test('renders typed HTML live inside the iframe', async ({ page }) => {
    await expect(page.locator('.code-pane-tab[data-tab="html"]')).toHaveAttribute('aria-selected', 'true');
    await typeText(page, HTML_PREFIX);

    // frameLocator auto-waits and re-resolves against the live frame document,
    // which is rebuilt by doc.write on each keystroke.
    const frame = page.frameLocator('iframe.render-pane-iframe');
    await expect(frame.locator('.preview-card')).toBeVisible();
    await expect(frame.locator('.preview-card h1')).toHaveText('Hello, CSE 110!');
  });
});
