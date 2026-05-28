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
    option: '.settings-option',
    slider: '.settings-overlay input[type="range"]',
    exit: '.settings-exit',
  },
  endScreen: {
    container: '.end-screen',
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
