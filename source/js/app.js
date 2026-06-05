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

import {
  initSettings,
  applySettings,
  loadSettings,
  resolveViewMode,
  MOBILE_MEDIA_QUERY,
} from './settings.js';
import { loadLevels } from './prompts.js';
import { initAudio } from './audio.js';

/**
 * Returns a friendly greeting for the given name.
 * @param {string} name - Name to greet
 * @returns {string} A greeting string
 */
export function greet(name) {
  return `Hello, ${name}!`;
}

/**
 * Wires the landing screen's difficulty and level selection. Difficulty is local
 * UI state that defaults to "beginner"; the Start link carries both the selected
 * level id and the difficulty to the game via ?level=<id>&difficulty=<value>.
 * @returns {Promise<void>}
 */
export async function setupLanding() {
  const diffButtons = Array.from(document.querySelectorAll('.difficulty-button'));
  const levelStack = document.querySelector('.level-stack');
  const startLink = document.querySelector('.start-button');
  if (!levelStack || !startLink) return;

  let difficulty = 'beginner';
  let selectedId = null;

  function highlightDifficulty() {
    diffButtons.forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.difficulty === difficulty)));
  }

  function updateStartHref() {
    startLink.setAttribute(
      'href',
      selectedId
        ? `game.html?level=${encodeURIComponent(selectedId)}&difficulty=${encodeURIComponent(difficulty)}`
        : 'game.html',
    );
  }

  function selectLevel(id, button) {
    selectedId = id;
    levelStack.querySelectorAll('.level-button').forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn === button)));
    updateStartHref();
  }

  async function renderLevels() {
    const levels = await loadLevels({ difficulty });
    levelStack.innerHTML = '';
    selectedId = null;

    if (levels.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'level-empty';
      msg.textContent = 'No levels available for this difficulty yet.';
      levelStack.appendChild(msg);
      updateStartHref();
      return;
    }

    levels.forEach((level, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-button';
      btn.textContent = level.title;
      btn.dataset.levelId = level.id;
      btn.setAttribute('aria-pressed', String(i === 0));
      btn.addEventListener('click', () => selectLevel(level.id, btn));
      levelStack.appendChild(btn);
    });

    // Default to the first level so Start always has a target.
    selectLevel(levels[0].id, levelStack.querySelector('.level-button'));
  }

  diffButtons.forEach((btn) =>
    btn.addEventListener('click', async () => {
      difficulty = btn.dataset.difficulty;
      highlightDifficulty();
      await renderLevels();
    }));

  highlightDifficulty();
  await renderLevels();
}

// Guarded so the module can be imported by the Node-based Jasmine runner
// (which exercises greet) without a DOM present.
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Reflect the effective view mode (and theme/color scheme) before first
    // paint so the landing screen opens in the right layout. With auto-detect
    // on, that's the device-detected mode; otherwise the user's last choice.
    const settings = loadSettings();
    applySettings({ ...settings, viewMode: resolveViewMode(settings, window) });

    initAudio();

    initSettings({
      buttonSelector: '.settings-button',
      mountSelector: '.landing-screen',
    });
    setupLanding();

    // While auto-detect is on, keep the landing layout in sync with the device
    // as the viewport changes (window resize, device rotation). Switching the
    // landing layout is free, so this is just an attribute flip. Re-read
    // settings each time since auto may have been toggled in the overlay.
    if (typeof window.matchMedia === 'function') {
      const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
      const onViewportChange = () => {
        const s = loadSettings();
        if (!s.autoViewMode) return;
        applySettings({ ...s, viewMode: resolveViewMode(s, window) });
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onViewportChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onViewportChange);
      }
    }
  });
}