/**
 * @file Game-screen bootstrap.
 *
 * Entry point for game.html. On DOMContentLoaded, initializes the render
 * pane and starts the game engine, then exposes a small handle on
 * window.__game for in-browser debugging.
 */

import { initRenderPane } from './renderPane.js';
import { startGame, getGameState } from './gameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  initRenderPane('.render-pane');
  startGame('Demo prompt');

  window.__game = { getGameState };
});
