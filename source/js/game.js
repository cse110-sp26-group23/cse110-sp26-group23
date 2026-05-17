import { initRenderPane } from './renderPane.js';
import { startGame, getGameState } from './gameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  initRenderPane('.render-pane');
  startGame('Demo prompt');

  window.__game = { getGameState };
});
