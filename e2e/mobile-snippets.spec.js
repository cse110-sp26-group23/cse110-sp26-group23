import { test, expect } from './helpers/fixtures.js';
import {
  startLevel,
  typeTokens,
  openSettings,
  closeSettings,
} from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerNewsletter;

test.describe('mobile snippet mode', () => {
  test('typing only the snippet tokens completes the round at 100% accuracy', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id, { settings: { viewMode: 'mobile' } });

    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');
    // Auto-filled scaffold is marked, confirming the pane is in snippet mode.
    await expect(ui.inputPane.scaffoldChars.first()).toBeVisible();

    await typeTokens(page, LEVEL.htmlSnippets);

    // Auto-advance flips to the CSS tab once the HTML snippets are done.
    await expect(ui.inputPane.cssTab).toHaveAttribute('aria-selected', 'true');
    await typeTokens(page, LEVEL.cssSnippets);

    await expect(ui.endScreen.container).toBeVisible();
    await expect(ui.endScreen.container.getByText('Round Complete')).toBeVisible();
    await expect(ui.endScreen.metricAccuracy).toHaveText('100%');
    await expect(ui.endScreen.metricErrors).toHaveText('0');
  });
});
