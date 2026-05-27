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
import { initSettings, loadSettings } from './settings.js';
import { loadLevels, nextLevelId } from './prompts.js';
import { setTimer, stopTimer } from './time.js';

window.addEventListener('DOMContentLoaded', async () => {
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

  // Once the typed tab(s) are complete, finish the round and show the metrics,
  // offering a Next Level link when one exists.
  function handleComplete({ targetText, typedText }) {
    stopTimer();
    completeGame();
    const { startTime, endTime } = getGameState();

    clearEndScreen();
    endOverlay = document.createElement('div');
    endOverlay.classList.add('end-screen-overlay');
    gameContainer.appendChild(endOverlay);

    showEndScreen(endOverlay, { targetText, typedText, startTime, endTime, nextLevelId: nextId });
  }

  // Load the ordered level list for the player's chosen difficulty, then pick
  // the level named in ?level=<id> (or the first when absent/unknown). If
  // nothing loads (broken data, offline), prompts is undefined so the input
  // pane falls back to its built-in DEFAULT_PROMPTS and the round still plays.
  const requestedId = new URLSearchParams(window.location.search).get('level');
  const levels = await loadLevels({ difficulty: loadSettings().difficulty });
  const current = levels.length
    ? (requestedId && levels.find((level) => level.id === requestedId)) || levels[0]
    : null;

  const prompts = current ? { html: current.html, css: current.css } : undefined;
  const mode = current ? current.mode : 'html_then_css';
  const nextId = current ? nextLevelId(levels, current.id) : null;

  initInputPane('.code-pane', prompts, renderTyped, handleComplete, mode);
  startGame(current ? current.id : 'Demo prompt');
  setTimer('.timer');

  // Reset the engine to idle first so a finished or in-progress round can
  // legally transition back to active.
  function restart() {
    resetGame();
    stopTimer();
    setTimer('.timer');
    clearEndScreen();
    resetInputPane();
    startGame(current ? current.id : 'Demo prompt');
    if (progressFill) progressFill.style.width = '0%';
  }

  // Toggling the View setting switches the typing model. The two models track
  // progress differently (snippet tokens vs. full characters), so the round is
  // rebuilt from scratch rather than migrated — matching the agreed design.
  function handleViewModeChange(mode) {
    snippetMode = mode === 'mobile';
    resetGame();
    stopTimer();
    setTimer('.timer');
    clearEndScreen();
    startInputPane();
    startGame('Demo prompt');
    if (progressFill) progressFill.style.width = '0%';
  }

  const settings = initSettings({
    buttonSelector: '.settings-button',
    mountSelector: '.game-container',
    onRestart: restart,
    onViewModeChange: handleViewModeChange,
  });

  window.__game = { getGameState, settings };
});
