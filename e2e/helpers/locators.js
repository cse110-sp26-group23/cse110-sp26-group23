/**
 * @file Locator factory. Specs do `const ui = locators(page)` (or use the
 * `ui` fixture from fixtures.js) and then reference ui.<area>.<name>, so
 * selector strings never appear in spec bodies.
 *
 * Locators are bound to one Page per call, which is why this is a factory
 * function rather than an exported tree of locators.
 */

import { SEL } from './selectors.js';

/**
 * Builds a tree of Playwright Locators bound to the given page.
 * @param {import('@playwright/test').Page} page
 */
export function locators(page) {
  return {
    landing: {
      title: page.locator(SEL.landing.title),
      sectionTitles: page.locator(SEL.landing.sectionTitle),
      difficultyButtons: page.locator(SEL.landing.difficultyButton),
      difficulty: (key) =>
        page.locator(`${SEL.landing.difficultyButton}[data-difficulty="${key}"]`),
      levelButtons: page.locator(SEL.landing.levelButton),
      level: (id) => page.locator(`${SEL.landing.levelButton}[data-level-id="${id}"]`),
      start: page.locator(SEL.landing.startButton),
      settingsButton: page.locator(SEL.landing.settingsButton),
    },
    game: {
      container: page.locator(SEL.game.container),
      timer: page.locator(SEL.game.timer),
      progressFill: page.locator(SEL.game.progressFill),
      settingsButton: page.locator(SEL.game.settingsButton),
      exitButton: page.locator(SEL.game.exitButton),
      iframe: page.locator(SEL.game.iframe),
      preview: page.frameLocator(SEL.game.iframe),
    },
    inputPane: {
      container: page.locator(SEL.inputPane.container),
      prompt: page.locator(SEL.inputPane.prompt),
      promptChars: page.locator(SEL.inputPane.promptChars),
      // The character class lives on the span itself, not on a descendant,
      // so these anchor inside the prompt and select by class directly.
      correctChars: page.locator(`${SEL.inputPane.prompt} .${SEL.charClass.correct}`),
      incorrectChars: page.locator(`${SEL.inputPane.prompt} .${SEL.charClass.incorrect}`),
      pendingChars: page.locator(`${SEL.inputPane.prompt} .${SEL.charClass.pending}`),
      cursor: page.locator(`${SEL.inputPane.prompt} .${SEL.charClass.cursor}`),
      scaffoldChars: page.locator(`${SEL.inputPane.prompt} .${SEL.charClass.scaffold}`),
      tablist: page.locator(SEL.inputPane.tablist),
      htmlTab: page.locator(SEL.inputPane.htmlTab),
      cssTab: page.locator(SEL.inputPane.cssTab),
    },
    settings: {
      overlay: page.locator(SEL.settings.overlay),
      panel: page.locator(SEL.settings.panel),
      modeButton: page.getByRole('button', { name: /^Mode:/ }),
      audioButton: page.getByRole('button', { name: /^Audio:/ }),
      difficultyButton: page.getByRole('button', { name: /^Difficulty:/ }),
      themeButton: page.getByRole('button', { name: /^Theme:/ }),
      viewButton: page.getByRole('button', { name: /^View:/ }),
      restartButton: page.getByRole('button', { name: 'Restart Level' }),
      volume: page.locator(SEL.settings.slider),
      exit: page.locator(SEL.settings.exit),
    },
    endScreen: {
      container: page.locator(SEL.endScreen.container),
      nextLevel: page.locator(SEL.endScreen.nextLevel),
      metricWpm: page.locator(SEL.endScreen.metricWpm),
      metricAccuracy: page.locator(SEL.endScreen.metricAccuracy),
      metricErrors: page.locator(SEL.endScreen.metricErrors),
      metricTime: page.locator(SEL.endScreen.metricTime),
    },
    /** Document root — load-bearing target for theme/view-mode data attributes. */
    htmlRoot: page.locator('html'),
  };
}
