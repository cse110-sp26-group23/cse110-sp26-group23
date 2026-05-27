/**
 * End screen helpers.
 * This is used to show the user their stats after a round.
 */

import { calculateRoundMetrics } from './metrics.js';

/**
 * Formats seconds for the UI.
 * @param {number} seconds - Time in seconds.
 * @returns {string} Time shown as text.
 */
export function formatElapsedTime(seconds) {
  if (typeof seconds !== 'number') {
    throw new Error('formatElapsedTime expects a number.');
  }

  return `${seconds.toFixed(2)}s`;
}

/**
 * Builds the end screen element.
 * @param {object} metrics - Metrics to display.
 * @param {number} metrics.wpm - Words per minute.
 * @param {number} metrics.accuracy - Accuracy percentage.
 * @param {number} metrics.errorCount - Number of errors.
 * @param {number} metrics.elapsedSeconds - Time in seconds.
 * @param {object} [options] - Extra options.
 * @param {?string} [options.nextLevelId] - When set, a "Next Level" link to
 *   game.html?level=<id> is shown so the player can advance. Omitted when null.
 * @returns {HTMLElement} End screen section.
 */
export function createEndScreen(metrics, { nextLevelId = null } = {}) {
  if (!metrics || typeof metrics !== 'object') {
    throw new Error('createEndScreen expects a metrics object.');
  }

  const {
    wpm = 0,
    accuracy = 0,
    errorCount = 0,
    elapsedSeconds = 0,
  } = metrics;

  const section = document.createElement('section');
  section.classList.add('end-screen');
  section.setAttribute('aria-label', 'End of round performance metrics');

  const nextButton = nextLevelId
    ? `<a
        class="end-screen-next"
        data-testid="next-level"
        href="game.html?level=${encodeURIComponent(nextLevelId)}">
        Next Level
      </a>`
    : '';

  section.innerHTML = `
    <h2>Round Complete</h2>

    <ul class="end-screen__metrics">
      <li><strong>WPM:</strong> <span data-testid="metric-wpm">${wpm}</span></li>
      <li><strong>Accuracy:</strong> <span data-testid="metric-accuracy">${accuracy}%</span></li>
      <li><strong>Errors:</strong> <span data-testid="metric-errors">${errorCount}</span></li>
      <li><strong>Time:</strong> <span data-testid="metric-time">${formatElapsedTime(elapsedSeconds)}</span></li>
        </ul>

    <div class="end-screen-buttons">
      <button
        type="button"
        onclick="window.location.reload()">
        Play Again
      </button>
      ${nextButton}
      <button
        type="button"
        onclick="window.location.href='index.html'">
        Exit
      </button>
    </div>
  `;

  return section;
}

/**
 * Puts the end screen inside a container.
 * @param {HTMLElement} container - Where the end screen should go.
 * @param {object} metrics - Metrics to show.
 * @param {object} [options] - Forwarded to {@link createEndScreen} (e.g. nextLevelId).
 * @returns {HTMLElement} The rendered end screen.
 */
export function renderEndScreen(container, metrics, options = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('renderEndScreen expects an HTMLElement container.');
  }

  const endScreen = createEndScreen(metrics, options);
  container.innerHTML = '';
  container.appendChild(endScreen);

  return endScreen;
}

/**
 * Calculates round metrics and then shows the end screen.
 * @param {HTMLElement} container - Where the end screen should go.
 * @param {object} roundData - Data from the round.
 * @param {string} roundData.targetText - Expected prompt.
 * @param {string} roundData.typedText - User input.
 * @param {number} roundData.startTime - Start time in milliseconds.
 * @param {number} roundData.endTime - End time in milliseconds.
 * @param {?string} [roundData.nextLevelId] - Id of the next level, if any.
 * @returns {HTMLElement} The rendered end screen.
 */
export function showEndScreen(container, roundData) {
  const metrics = calculateRoundMetrics(roundData);
  return renderEndScreen(container, metrics, { nextLevelId: roundData?.nextLevelId ?? null });
}