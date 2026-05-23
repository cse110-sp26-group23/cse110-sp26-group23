/**
 * @file Game-screen bootstrap.
 *
 * Entry point for game.html. On DOMContentLoaded, initializes the render
 * pane and input pane, starts the game engine, and shows the end screen once
 * every tab has been typed to completion. Exposes a small handle on
 * window.__game for in-browser debugging.
 */

import { initRenderPane, renderPreview } from './renderPane.js';
import { initInputPane, reset as resetInputPane } from './inputPane.js';
import { startGame, completeGame, resetGame, getGameState } from './gameEngine.js';
import { showEndScreen } from './endScreen.js';
import { initSettings } from './settings.js';
import { setTimer, stopTimer } from './time.js';

window.addEventListener('DOMContentLoaded', () => {
  const previewFrame = initRenderPane('.render-pane');
  const gameContainer = document.querySelector('.game-container');
  const progressFill = document.querySelector('.progress-bar-fill');

  // The end screen is mounted as an overlay over the game and torn down on
  // restart, so the round can be replayed cleanly.
  let endOverlay = null;

  function clearEndScreen() {
    if (endOverlay) {
      endOverlay.remove();
      endOverlay = null;
    }
  }

  // Builds the iframe document from the typed HTML/CSS: the CSS tab's text
  // becomes a <style> block and the HTML tab's text the body content.
  function renderTyped({ html, css, progress }) {
    renderPreview(previewFrame, `<style>\n${css}\n</style>\n${html}`);
    if (progressFill) {
      progressFill.style.width = `${progress.toFixed(1)}%`;
    }
  }

  // Once every tab is typed correctly, finish the round and show the metrics.
  function handleComplete({ targetText, typedText }) {
    stopTimer();
    completeGame();
    const { startTime, endTime } = getGameState();

    clearEndScreen();
    endOverlay = document.createElement('div');
    endOverlay.classList.add('end-screen-overlay');
    gameContainer.appendChild(endOverlay);

    showEndScreen(endOverlay, { targetText, typedText, startTime, endTime });
  }

  initInputPane('.code-pane', undefined, renderTyped, handleComplete);
  startGame('Demo prompt');
  setTimer('.timer');

  // Reset the engine to idle first so a finished or in-progress round can
  // legally transition back to active.
  function restart() {
    resetGame();
    stopTimer();
    setTimer('.timer');
    clearEndScreen();
    resetInputPane();
    startGame('Demo prompt');
    if (progressFill) progressFill.style.width = '0%';
  }

  const settings = initSettings({
    buttonSelector: '.settings-button',
    mountSelector: '.game-container',
    onRestart: restart,
  });

  window.__game = { getGameState, settings };
});
