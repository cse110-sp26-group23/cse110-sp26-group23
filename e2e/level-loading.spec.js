import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt, gotoLanding } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

test.describe('mode-aware input pane', () => {
  test('a css_only level locks the HTML tab and completes on CSS alone', async ({ page, ui }) => {
    await startLevel(page, LEVELS.beginnerRecolor.id);

    // CSS is the active typed tab; HTML is the locked, pre-filled scaffold.
    await expect(ui.inputPane.cssTab).toHaveAttribute('aria-selected', 'true');
    await expect(ui.inputPane.htmlTab).toHaveAttribute('data-locked', 'true');

    await typePrompt(page, LEVELS.beginnerRecolor.css);

    // Round completes from the CSS alone, and accuracy reflects only typed CSS.
    await expect(ui.endScreen.container).toBeVisible();
    await expect(ui.endScreen.metricAccuracy).toHaveText('100%');
  });
});

test.describe('level progression', () => {
  test('Next Level advances to the following level in the difficulty', async ({ page, ui }) => {
    await startLevel(page, LEVELS.beginnerHeading.id);

    // html_only: type only the HTML.
    await expect(ui.inputPane.htmlTab).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, LEVELS.beginnerHeading.html);

    await expect(ui.endScreen.nextLevel).toBeVisible();
    await ui.endScreen.nextLevel.click();

    // The next beginner level after beginner-heading is beginner-recolor.
    await expect(page).toHaveURL(new RegExp(`level=${LEVELS.beginnerRecolor.id}`));
  });
});

test.describe('landing selection', () => {
  test('choosing a difficulty repopulates levels and Start carries the level id', async ({ page, ui }) => {
    await gotoLanding(page);

    // Beginner is the default difficulty; its levels are listed by title.
    await expect(ui.landing.levelButtons.first()).toBeVisible();
    const beginnerCount = await ui.landing.levelButtons.count();
    expect(beginnerCount).toBeGreaterThan(0);

    // Start carries the first level's id by default.
    await expect(ui.landing.start).toHaveAttribute('href', /game\.html\?level=/);

    // Switching difficulty regenerates the list. Wait for the known first
    // intermediate level to appear so we don't read the stale beginner list.
    await ui.landing.difficulty('intermediate').click();
    await expect(ui.landing.difficulty('intermediate')).toHaveAttribute('aria-pressed', 'true');
    const firstLevel = ui.landing.levelButtons.first();
    await expect(firstLevel).toHaveAttribute(
      'data-level-id',
      LEVELS.intermediateProfileCard.id,
    );

    // Picking a level updates the Start href to that level.
    const levelId = await firstLevel.getAttribute('data-level-id');
    await firstLevel.click();
    await expect(ui.landing.start).toHaveAttribute('href', `game.html?level=${levelId}`);
  });
});
