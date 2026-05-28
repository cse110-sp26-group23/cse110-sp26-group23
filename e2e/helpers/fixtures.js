/**
 * @file Playwright fixtures.
 *
 * Specs import `test` and `expect` from this module instead of from
 * '@playwright/test' directly. The custom `test` adds the `ui` fixture
 * (a locator tree bound to `page`) so every spec saves the
 * `const ui = locators(page)` line and selector mechanics stay out of
 * spec bodies.
 *
 * Only add a new fixture here when ≥2 specs share the setup; one-off
 * setup belongs in the spec.
 */

import { test as base, expect } from '@playwright/test';
import { locators } from './locators.js';
import { seedSettings } from './settings.js';

export const test = base.extend({
  /**
   * Locator tree bound to the current page.
   * @type {ReturnType<typeof locators>}
   */
  ui: async ({ page }, use) => {
    await use(locators(page));
  },

  /**
   * Page with default settings already seeded into localStorage. Combine
   * with `test.use({ ... })` overrides if a spec needs different defaults.
   */
  seededPage: async ({ page }, use) => {
    await seedSettings(page);
    await use(page);
  },
});

export { expect };
