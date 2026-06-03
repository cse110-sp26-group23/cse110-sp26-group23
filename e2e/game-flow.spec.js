import { test, expect } from './helpers/fixtures.js';
import { startLevel, typePrompt } from './helpers/index.js';
import { LEVELS } from './data/levels.js';

const LEVEL = LEVELS.beginnerNewsletter;

test.describe('full game flow', () => {
  test('typing an html_then_css level perfectly reaches the end screen with 100% accuracy', async ({ page, ui }) => {
    await startLevel(page, LEVEL.id);

    // HTML tab is active first.
    await expect(ui.inputPane.htmlTab).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, LEVEL.html);

    // Auto-advance switches to CSS after ~1s; auto-waiting absorbs the delay.
    await expect(ui.inputPane.cssTab).toHaveAttribute('aria-selected', 'true');
    await typePrompt(page, LEVEL.css);

    // Completion appends the end-screen overlay.
    await expect(ui.endScreen.container).toBeVisible();
    await expect(ui.endScreen.container.getByText('Round Complete')).toBeVisible();
    await expect(ui.endScreen.metricAccuracy).toHaveText('100%');
    await expect(ui.endScreen.metricErrors).toHaveText('0');
    await expect(ui.endScreen.metricTime).toHaveText(/^\d+\.\d{2}s$/);
    await expect(ui.endScreen.metricWpm).not.toBeEmpty();
  });

  test('the View Page toggle peels back the metrics panel and restores it', async ({ page, ui }) => {
    await startLevel(page, LEVELS.beginnerSaleBadge.id);
    await typePrompt(page, LEVELS.beginnerSaleBadge.css);
    await expect(ui.endScreen.container).toBeVisible();

    // Peek: the overlay enters peek mode so the finished page shows behind,
    // the metrics hide, and the toggle relabels.
    await ui.endScreen.togglePreview.click();
    await expect(ui.endScreen.overlay).toHaveClass(/is-peeking/);
    await expect(ui.endScreen.metricAccuracy).toBeHidden();
    await expect(ui.endScreen.togglePreview).toHaveText('Hide Page');
    await expect(ui.endScreen.togglePreview).toHaveAttribute('aria-pressed', 'true');

    // Toggling again restores the metrics panel.
    await ui.endScreen.togglePreview.click();
    await expect(ui.endScreen.overlay).not.toHaveClass(/is-peeking/);
    await expect(ui.endScreen.metricAccuracy).toBeVisible();
    await expect(ui.endScreen.togglePreview).toHaveText('View Page');
  });
});
