import { initRenderPane } from './renderPane.js';
import{ initInputPane } from './inputPane.js'
import { startGame, getGameState } from './gameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  initRenderPane('.render-pane');
  initInputPane('.code-pane');
  startGame('Demo prompt');
  
  window.__game = { getGameState };
});
