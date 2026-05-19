import { initRenderPane } from './renderPane.js';
import { startGame, getGameState } from './gameEngine.js';
import { initSettings } from './settings.js';

window.addEventListener('DOMContentLoaded', () => {
  initRenderPane('.render-pane');
  startGame('Demo prompt');

  const settings = initSettings({
    buttonSelector: '.settings-button',
    mountSelector: '.game-container',
    onRestart: () => startGame('Demo prompt'),
  });

  window.__game = { getGameState, settings };
});
