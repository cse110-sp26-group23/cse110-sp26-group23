import { test, expect } from './helpers/fixtures.js';
import { startLevel } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerNewsletter;
const ALL_TOKENS = [...LEVEL.htmlSnippets, ...LEVEL.cssSnippets];

/**
 * Drags the tile bearing `token` onto the drop zone by dispatching the same
 * HTML5 dragstart/dragover/drop sequence the production handler listens for,
 * threaded through one shared DataTransfer. Playwright's pointer-based dragTo
 * does not reliably initiate native HTML5 drag-and-drop, so we drive the real
 * event contract directly — still through the unmodified source handlers.
 */
async function dragTile(page, token) {
  await page.evaluate((tokenText) => {
    const tile = [...document.querySelectorAll('.drag-drop-tile')].find(
      (el) => el.textContent === tokenText,
    );
    const zone = document.querySelector('.drag-drop-zone');
    const dataTransfer = new DataTransfer();
    tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
    tile.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer }));
  }, token);
}

test.describe('drag-and-drop snippet picker (mobile)', () => {
  test('renders the pane with three option tiles including the correct token', async ({
    page,
    ui,
  }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');
    await expect(ui.dragDrop.pane).toBeVisible();
    await expect(ui.dragDrop.tiles).toHaveCount(3);
    // The first token of the level must be offered as one of the three tiles.
    await expect(ui.dragDrop.tile(LEVEL.htmlSnippets[0])).toBeVisible();
  });

  test('does not render tiles in desktop view', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'desktop' } });

    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
    await expect(ui.dragDrop.tiles).toHaveCount(0);
  });

  test('dragging the correct tile advances to the next token', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    await expect(ui.dragDrop.tile(LEVEL.htmlSnippets[0])).toBeVisible();
    await dragTile(page, LEVEL.htmlSnippets[0]);

    // A correct drop submits the snippet and re-renders the pane for the next
    // token, so the second token's tile is now on offer.
    await expect(ui.dragDrop.tile(LEVEL.htmlSnippets[1])).toBeVisible();
  });

  test('dragging a wrong tile does not advance the token', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    const correct = LEVEL.htmlSnippets[0];
    await expect(ui.dragDrop.tile(correct)).toBeVisible();

    // Pick whichever offered tile is not the correct answer.
    const wrong = await ui.dragDrop.tiles
      .filter({ hasNotText: new RegExp(`^${correct}$`) })
      .first()
      .textContent();
    await dragTile(page, wrong.trim());

    // The pane stays on the same token: the correct tile is still showing and
    // the level has not progressed.
    await expect(ui.dragDrop.tile(correct)).toBeVisible();
  });

  test('dragging every correct tile completes the round with no errors', async ({
    page,
    ui,
  }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    for (const token of ALL_TOKENS) {
      await expect(ui.dragDrop.tile(token)).toBeVisible();
      await dragTile(page, token);
    }

    await expect(ui.endScreen.container).toBeVisible();
    await expect(ui.endScreen.container.getByText('Round Complete')).toBeVisible();
    await expect(ui.endScreen.metricErrors).toHaveText('0');
  });

  test('a wrong drop is counted as a mistake on the end screen', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    const correct = ALL_TOKENS[0];
    await expect(ui.dragDrop.tile(correct)).toBeVisible();

    // One deliberate wrong drop before playing the level out correctly.
    const wrong = await ui.dragDrop.tiles
      .filter({ hasNotText: new RegExp(`^${correct}$`) })
      .first()
      .textContent();
    await dragTile(page, wrong.trim());

    for (const token of ALL_TOKENS) {
      await expect(ui.dragDrop.tile(token)).toBeVisible();
      await dragTile(page, token);
    }

    await expect(ui.endScreen.container).toBeVisible();
    await expect(ui.endScreen.metricErrors).toHaveText('1');
  });
});
