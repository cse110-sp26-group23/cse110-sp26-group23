/**
 * @file Single source of truth for CSS / data-testid selectors used by E2E
 * specs. Specs should never inline a selector string — they should reference
 * SEL.<area>.<name> here (directly or via the locators(page) factory).
 *
 * Selectors are grouped by feature area to keep additions local. When markup
 * changes in source/, update one constant here rather than chasing strings
 * across every spec.
 */

export const SEL = Object.freeze({
  landing: {
    title: 'h1.game-title',
    sectionTitle: 'h2.section-title',
    difficultyButton: '.difficulty-button',
    levelButton: '.level-button',
    startButton: '.start-button',
    settingsButton: '.settings-button',
  },
  game: {
    container: '.game-container',
    timer: '.timer',
    progressFill: '.progress-bar-fill',
    settingsButton: '.settings-button',
    exitButton: '.exit-button',
    iframe: 'iframe.render-pane-iframe',
  },
  inputPane: {
    container: '.code-pane',
    prompt: '.code-pane-prompt',
    promptChars: '.code-pane-prompt > span',
    tablist: '.code-pane-tabs',
    tab: '.code-pane-tab',
    htmlTab: '.code-pane-tab[data-tab="html"]',
    cssTab: '.code-pane-tab[data-tab="css"]',
  },
  settings: {
    overlay: '.settings-overlay',
    panel: '.settings-panel',
    // Editable numeric value inside the `<audio volume="N" />` control.
    // Contenteditable, not an <input>, so Playwright drives it via
    // .focus() + keyboard typing rather than .fill(). The contenteditable
    // attribute distinguishes it from the cyclable token values that share
    // the .settings-code-value class.
    slider: '.settings-overlay .settings-code-value[contenteditable]',
    exit: '.settings-exit',
  },
  endScreen: {
    overlay: '.end-screen-overlay',
    container: '.end-screen',
    togglePreview: '[data-testid="toggle-preview"]',
    nextLevel: '[data-testid="next-level"]',
    metricWpm: '[data-testid="metric-wpm"]',
    metricAccuracy: '[data-testid="metric-accuracy"]',
    metricErrors: '[data-testid="metric-errors"]',
    metricTime: '[data-testid="metric-time"]',
  },
  charClass: {
    correct: 'char-correct',
    incorrect: 'char-incorrect',
    pending: 'char-pending',
    cursor: 'char-cursor',
    scaffold: 'char-scaffold',
  },
});
