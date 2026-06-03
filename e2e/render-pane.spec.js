import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt, openSettings } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

// renderPane.js writes the typed HTML/CSS into a sandboxed iframe's LIVE
// document on every keystroke (doc.open/write/close). jsdom can't exercise
// iframe content-document semantics, so this lives here.
//
// game.html with no ?level loads the first beginner level (beginner-breaking-news);
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
    await typePrompt(page, LEVELS.beginnerBreakingNews.htmlPrefix);

    // frameLocator auto-waits and re-resolves against the live frame document,
    // which is rebuilt by doc.write on each keystroke.
    await expect(ui.game.preview.locator('h1')).toBeVisible();
    await expect(ui.game.preview.locator('h1')).toHaveText('City Unveils New Riverside Park');
  });
});

// The preview iframe is a separate document, so renderPane.js injects the
// active theme's color variables into its :root and game.js re-injects them on
// every settings change. This proves both the injection and the live re-sync.
test.describe('render pane theme variables', () => {
  // Re-resolve the frame on each read: doc.write rebuilds the document on every
  // render, so a handle captured earlier can go stale.
  async function readPreviewVar(ui, name) {
    const frame = await (await ui.game.iframe.elementHandle()).contentFrame();
    return frame.evaluate(
      (varName) =>
        getComputedStyle(document.documentElement).getPropertyValue(varName).trim(),
      name,
    );
  }

  function parentVar(page, name) {
    return page.evaluate(
      (varName) =>
        getComputedStyle(document.documentElement).getPropertyValue(varName).trim(),
      name,
    );
  }

  test('exposes the active theme palette and re-syncs when the theme changes', async ({ page, ui }) => {
    await startLevel(page);

    // The default theme's brand color is injected into the iframe :root and
    // matches the parent document.
    const parentDefault = await parentVar(page, '--brand-orange');
    expect(parentDefault).not.toBe('');
    await expect.poll(() => readPreviewVar(ui, '--brand-orange')).toBe(parentDefault);

    // Switching theme repaints the preview with the new palette without reload.
    await openSettings(page);
    await ui.settings.themeButton.click(); // default -> next theme
    const parentNext = await parentVar(page, '--brand-orange');
    expect(parentNext).not.toBe(parentDefault);
    await expect.poll(() => readPreviewVar(ui, '--brand-orange')).toBe(parentNext);
  });
});
