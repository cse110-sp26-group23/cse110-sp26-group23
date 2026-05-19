/**
 * @file Game-screen bootstrap.
 *
 * Entry point for game.html. On DOMContentLoaded, initializes the render
 * pane and starts the game engine, then exposes a small handle on
 * window.__game for in-browser debugging.
 */

import { initRenderPane } from './renderPane.js';
import{ initInputPane } from './inputPane.js'
import { startGame, getGameState } from './gameEngine.js';
import { initSettings } from './settings.js';

window.addEventListener('DOMContentLoaded', () => {
  initRenderPane('.render-pane');
  initInputPane('.code-pane');
  startGame('Demo prompt');

  const settings = initSettings({
    buttonSelector: '.settings-button',
    mountSelector: '.game-container',
    onRestart: () => startGame('Demo prompt'),
  });

  window.__game = { getGameState, settings };
});
