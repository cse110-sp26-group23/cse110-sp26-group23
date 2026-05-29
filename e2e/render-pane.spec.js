import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

// renderPane.js writes the typed HTML/CSS into a sandboxed iframe's LIVE
// document on every keystroke (doc.open/write/close). jsdom can't exercise
// iframe content-document semantics, so this lives here.
//
// game.html with no ?level loads the first beginner level (beginner-heading);
// we type its known HTML prefix and assert it renders.

test.describe('render pane', () => {
  test.beforeEach(async ({ page }) => {
    await startLevel(page);
  });

  test('creates the sandboxed preview iframe', async ({ ui }) => {
    await expect(ui.game.iframe).toHaveAttribute('title', 'Code output preview');
    await expect(ui.game.iframe).toHaveAttribute('sandbox', 'allow-same-origin');
  });

  test('renders typed HTML live inside the iframe', async ({ page, ui }) => {
    await expect(ui.inputPane.htmlTab).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, LEVELS.beginnerHeading.htmlPrefix);

    // frameLocator auto-waits and re-resolves against the live frame document,
    // which is rebuilt by doc.write on each keystroke.
    await expect(ui.game.preview.locator('h1')).toBeVisible();
    await expect(ui.game.preview.locator('h1')).toHaveText('Hello, CSE 110!');
  });
});
