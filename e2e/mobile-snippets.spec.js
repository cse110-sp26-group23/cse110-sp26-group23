import { test, expect } from './helpers/fixtures.js';
import {
  startLevel,
  typeTokens,
  openSettings,
  closeSettings,
} from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerFlexboxRow;

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

  test('toggling the View setting switches in and out of snippet mode', async ({ page, ui }) => {
    await startLevel(page); // desktop is the default view

    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
    await expect(ui.inputPane.scaffoldChars).toHaveCount(0);

    // Desktop -> Mobile via the settings overlay.
    await openSettings(page);
    await ui.settings.viewButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'mobile');
    await closeSettings(page);

    // Snippet mode is now active: scaffold is auto-filled.
    await expect(ui.inputPane.scaffoldChars.first()).toBeVisible();

    // Mobile -> Desktop and confirm snippet mode is gone.
    await openSettings(page);
    await ui.settings.viewButton.click();
    await expect(ui.htmlRoot).toHaveAttribute('data-view-mode', 'desktop');
    await closeSettings(page);
    await expect(ui.inputPane.scaffoldChars).toHaveCount(0);
  });
});
