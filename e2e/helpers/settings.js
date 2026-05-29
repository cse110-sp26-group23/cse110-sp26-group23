/**
 * @file Settings seeding and inspection.
 *
 * seedSettings runs before any page script so the game boots straight into
 * the requested state; readStoredSettings inspects what the page actually
 * persisted after a flow has run.
 */

import { STORAGE_KEY, DEFAULT_SETTINGS } from './constants.js';

/**
 * Pre-populates localStorage on the next navigation. Partial values are
 * merged over DEFAULT_SETTINGS, so a spec needs to mention only the fields
 * it cares about.
 * @param {import('@playwright/test').Page} page
 * @param {object} [partial] - Fields to override (e.g. { viewMode: 'mobile' }).
 */
export async function seedSettings(page, partial = {}) {
  const value = { ...DEFAULT_SETTINGS, ...partial };
  await page.addInitScript(
    ([key, payload]) => {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    [STORAGE_KEY, value],
  );
}

/**
 * Reads the persisted settings from the running page. Returns null if no
 * settings have been stored yet.
 * @param {import('@playwright/test').Page} page
 */
export async function readStoredSettings(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, STORAGE_KEY);
}
