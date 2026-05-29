/**
 * @file Landing-screen bootstrap.
 *
 * Entry point for index.html. On DOMContentLoaded it applies the persisted
 * settings to the document (so the saved view mode switches the landing
 * layout between desktop and the mobile wireframe via [data-view-mode]) and
 * mounts the settings overlay behind the Settings button. The DOM wiring here
 * is covered by E2E tests; the exported greet helper is the unit-test smoke
 * check for the Jasmine runner.
 */

import { initSettings, applySettings, loadSettings } from './settings.js';

/**
 * Returns a friendly greeting for the given name.
 * @param {string} name - Name to greet
 * @returns {string} A greeting string
 */
export function greet(name) {
  return `Hello, ${name}!`;
}

// Guarded so the module can be imported by the Node-based Jasmine runner
// (which exercises greet) without a DOM present.
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Reflect the saved view mode (and theme/color scheme) before first paint
    // so the landing screen opens in the layout the user last chose.
    applySettings(loadSettings());

    initSettings({
      buttonSelector: '.settings-button',
      mountSelector: '.landing-screen',
    });

    let selectedDifficulty = null;
    let selectedLevel = null;

    document.querySelectorAll('.difficulty-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDifficulty = btn.dataset.difficulty;
      });
    });

    document.querySelectorAll('.level-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.level-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLevel = btn.dataset.level;
      });
    });

    document.querySelector('.start-button').addEventListener('click', (e) => {
      e.preventDefault();
      if (!selectedDifficulty || !selectedLevel) return;
      window.location.href = `game.html?difficulty=${selectedDifficulty}&level=${selectedLevel}`;
    });
  });
}