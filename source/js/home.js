/**
 * @file Home page bootstrap.
 *
 * Entry point for index.html. Starts the hero typing animation with the
 * live render preview once the DOM is ready.
 */

import { initHeroTyping } from './hero.js';

window.addEventListener('DOMContentLoaded', () => {
  const codeEl = document.querySelector('.hero-code');
  const heroEl = document.querySelector('.home-hero');
  const heroFgEl = document.querySelector('.hero-fg');
  if (codeEl && heroEl) initHeroTyping(codeEl, heroEl, heroFgEl);
});
