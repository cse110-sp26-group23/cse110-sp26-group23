/**
 * @file Game-screen bootstrap.
 *
 * Entry point for game.html. On DOMContentLoaded, initializes the render
 * pane and starts the game engine, then exposes a small handle on
 * window.__game for in-browser debugging.
 */

import { initRenderPane, renderPreview } from './renderPane.js';
import { initInputPane } from './inputPane.js';
import { startGame, getGameState } from './gameEngine.js';
import { initSettings } from './settings.js';

window.addEventListener('DOMContentLoaded', () => {
  const previewFrame = initRenderPane('.render-pane');

  // Each keystroke re-renders the typed HTML/CSS in the preview iframe: the CSS
  // tab's text becomes a <style> block and the HTML tab's text the body content.
  initInputPane('.code-pane', undefined, ({ html, css }) => {
    renderPreview(previewFrame, `<style>\n${css}\n</style>\n${html}`);
  });

  startGame('Demo prompt');

  const settings = initSettings({
    buttonSelector: '.settings-button',
    mountSelector: '.game-container',
    onRestart: () => startGame('Demo prompt'),
  });

  window.__game = { getGameState, settings };
});
