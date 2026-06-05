/**
 * @file Site-wide bootstrap.
 *
 * Loaded on every page. Applies the saved theme immediately at module-parse
 * time (before DOMContentLoaded) to prevent a flash of the default theme,
 * then on DOMContentLoaded mounts the global settings overlay and wires it
 * to the navbar settings button.
 */

import { applySettings, loadSettings, createSettingsScreen } from './settings.js';

// Runs right after HTML is parsed — document.documentElement is available
// but before first paint, so the correct theme is set before anything renders.
applySettings(loadSettings());

window.addEventListener('DOMContentLoaded', () => {
  const screen = createSettingsScreen();

  const wrapper = document.createElement('div');
  wrapper.className = 'site-settings-wrapper';
  wrapper.appendChild(screen.element);
  document.body.appendChild(wrapper);

  const btn = document.querySelector('.site-nav-settings');
  if (btn) btn.addEventListener('click', screen.open);
});
