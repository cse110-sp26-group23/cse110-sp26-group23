/**
 * @file Progress persistence E2E: completing a level writes a record with
 * the correct levelId, difficulty, and stats to localStorage.
 */

import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt } from './helpers/index.js';
import { PROGRESS_STORAGE_KEY } from './helpers/constants.js';
import { LEVELS } from './data/levels.js';
import { SEL } from './helpers/selectors.js';

const LEVEL = LEVELS.beginnerNewsletter;

async function completeLevel(page) {
  await typePrompt(page, LEVEL.html);
  await expect(page.locator(SEL.inputPane.cssTab)).toHaveAttribute('aria-selected', 'true');
  await typePrompt(page, LEVEL.css);
  await expect(page.locator(SEL.endScreen.container)).toBeVisible();
}

test.describe('progress persistence', () => {
  test('completing a level writes a record to localStorage', async ({ page }) => {
    await startLevel(page, LEVEL.id);
    await completeLevel(page);

    const records = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    }, PROGRESS_STORAGE_KEY);

    expect(records).not.toBeNull();
    expect(records.length).toBe(1);
    expect(records[0].levelId).toBe(LEVEL.id);
    expect(records[0].difficulty).toBe('beginner');
    expect(typeof records[0].wpm).toBe('number');
    expect(typeof records[0].accuracy).toBe('number');
    expect(typeof records[0].errorCount).toBe('number');
    expect(typeof records[0].elapsedSeconds).toBe('number');
    expect(typeof records[0].completedAt).toBe('number');
  });

  test('each completed level appends a new record', async ({ page }) => {
    await startLevel(page, LEVEL.id);
    await completeLevel(page);

    await startLevel(page, LEVEL.id);
    await completeLevel(page);

    const records = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    }, PROGRESS_STORAGE_KEY);

    expect(records.length).toBe(2);
  });
});
