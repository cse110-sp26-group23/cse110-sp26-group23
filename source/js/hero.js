/**
 * @file Hero background typing animation with live render preview.
 *
 * Cycles through five custom card snippets pseudo-randomly, typing them into
 * the background while rendering the result live inside the frosted-glass
 * hero card. Each snippet writes HTML first so elements appear immediately,
 * then the style block applies as it is typed. Pauses via IntersectionObserver
 * when scrolled off-screen.
 */

import { createRenderPane, renderPreview, refreshThemeColors } from './renderPane.js';
import { SETTINGS_CHANGE_EVENT } from './settings.js';

/** Milliseconds per character. */
const CHAR_MS = 25;
/** Pause on the finished card before fading out (ms). */
const END_PAUSE_MS = 2000;
/** Fade duration — must match the CSS transitions on .hero-code and .hero-fg. */
const FADE_MS = 1500;
/** Number of recent picks to exclude from the next random selection. */
const ANTI_REPEAT = 3;

/**
 * Five custom hero card snippets. HTML is written first so elements appear and
 * render immediately; the trailing <style> block then styles them progressively.
 * @type {Array<{id: string, code: string}>}
 */
const SNIPPETS = [
  {
    id: 'the-hook',
    code: `<div class="wrap">
  <div class="logo">Codekata</div>
  <div class="tagline">The code typing game
for developers.</div>
  <p class="body">Typing brackets, semicolons, and angle
brackets without thinking is a skill.
Codekata builds it on real HTML and CSS.</p>
  <a class="btn" href="play.html">Start Playing</a>
</div>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.wrap {
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.logo {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-orange-strong);
  letter-spacing: -0.02em;
}
.tagline {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.body {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.65;
}
.btn {
  background: var(--brand-orange);
  color: #fff;
  padding: 0.65rem 1.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
  margin-top: 0.25rem;
}
</style>`,
  },
  {
    id: 'why-it-matters',
    code: `<div class="card">
  <div class="brand">Codekata</div>
  <h2>Why typing code matters</h2>
  <ul>
    <li>Syntax fluency lets you focus on
logic instead of looking for keys</li>
    <li>Automatic recall for HTML structure
and CSS patterns cuts real dev time</li>
    <li>Accuracy under pressure comes from
repetition, not from being careful</li>
    <li>Every level uses actual code, not
made-up practice text</li>
  </ul>
</div>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.card {
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.brand {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand-orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}
ul { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
li {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--muted);
  padding-left: 1rem;
  position: relative;
}
li::before {
  content: "//";
  position: absolute;
  left: 0;
  color: var(--brand-orange);
  font-size: 0.75rem;
  font-weight: 700;
}
</style>`,
  },
  {
    id: 'how-it-works',
    code: `<div class="card">
  <div class="brand">Codekata</div>
  <h2>How it works</h2>
  <div class="steps">
    <div class="step">
      <div class="num">01</div>
      <div class="detail">
        <div class="title">Pick your level</div>
        <div class="desc">Easy, Medium, or Hard.
Real HTML and CSS in every level.</div>
      </div>
    </div>
    <div class="step">
      <div class="num">02</div>
      <div class="detail">
        <div class="title">Type the code</div>
        <div class="desc">Match every character. The output
renders live in a preview pane.</div>
      </div>
    </div>
    <div class="step">
      <div class="num">03</div>
      <div class="detail">
        <div class="title">See your score</div>
        <div class="desc">WPM, accuracy, and error count.
Come back and beat your last run.</div>
      </div>
    </div>
  </div>
</div>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.card {
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.brand {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand-orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
}
.steps { display: flex; flex-direction: column; gap: 0.9rem; }
.step { display: flex; gap: 1rem; align-items: flex-start; }
.num {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--brand-orange);
  line-height: 1;
  flex-shrink: 0;
  width: 2rem;
}
.title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.desc {
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.5;
}
</style>`,
  },
  {
    id: 'skills',
    code: `<div class="card">
  <div class="brand">Codekata</div>
  <h2>What you will practice</h2>
  <p>Nine levels of real front-end code
across three difficulty tiers.</p>
  <div class="tags">
    <span class="tag a">HTML Structure</span>
    <span class="tag b">CSS Syntax</span>
    <span class="tag a">Flexbox and Grid</span>
    <span class="tag c">Typing Speed</span>
    <span class="tag b">Selector Fluency</span>
    <span class="tag c">Keystroke Accuracy</span>
    <span class="tag a">Nesting and Indentation</span>
    <span class="tag b">Bracket Matching</span>
  </div>
  <a class="btn" href="play.html">Start Practicing</a>
</div>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.card {
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.brand {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand-orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
h2 { font-size: 1.2rem; font-weight: 700; color: var(--text); }
p { color: var(--muted); font-size: 0.88rem; line-height: 1.5; }
.tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tag {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}
.a { background: #f9731618; border: 1px solid var(--brand-orange); color: var(--brand-orange); }
.b { background: #f59e0b18; border: 1px solid var(--brand-amber); color: var(--brand-amber); }
.c { background: #22c55e18; border: 1px solid #22c55e; color: #22c55e; }
.btn {
  background: var(--brand-orange);
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
}
</style>`,
  },
  {
    id: 'get-started',
    code: `<div class="card">
  <div class="logo">Codekata</div>
  <h2>Give it a try</h2>
  <p>Runs entirely in your browser.
No account or setup needed.</p>
  <p>Pick a difficulty, type the code,
and see how fast and accurate you are.
Nine levels to work through.</p>
  <a class="btn" href="play.html">Open Codekata</a>
</div>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}
.card {
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.logo {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-orange-strong);
  letter-spacing: -0.02em;
}
h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.25;
}
p {
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.65;
}
.btn {
  background: var(--brand-orange);
  color: #fff;
  padding: 0.65rem 1.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-block;
  align-self: flex-start;
  margin-top: 0.25rem;
}
</style>`,
  },
];

/**
 * Picks the next snippet pseudo-randomly, excluding recently shown ones.
 * Falls back to the full pool when all are inside the recent window.
 * @param {Array<{id: string, code: string}>} pool - All available snippets.
 * @param {string[]} recentIds - IDs of recently shown snippets.
 * @returns {{id: string, code: string}} The chosen snippet.
 */
function pickNext(pool, recentIds) {
  const fresh = pool.filter((s) => !recentIds.includes(s.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Initialises the hero typing animation with a live render inside the hero card.
 * @param {HTMLElement} codeEl - Element characters are typed into.
 * @param {HTMLElement} heroEl - Hero section watched for viewport visibility.
 * @param {HTMLElement|null} heroFgEl - Frosted-glass card that hosts the render iframe.
 */
export function initHeroTyping(codeEl, heroEl, heroFgEl) {
  const iframe = heroFgEl ? createRenderPane(heroFgEl, ['allow-top-navigation-by-user-activation']) : null;
  const recentIds = [];
  let timeoutId = null;
  let charIndex = 0;
  let currentText = '';
  let currentSnippet = null;
  let active = true;
  // True while the render card is faded out waiting for the next render update.
  let renderFaded = false;

  function schedule(fn, delay) {
    timeoutId = setTimeout(fn, delay);
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function updateRender() {
    if (!iframe || !currentSnippet) return;
    renderPreview(iframe, currentText.slice(0, charIndex));
    // Fade the card back in on the first render update after a transition.
    if (renderFaded && heroFgEl) {
      heroFgEl.classList.remove('is-fading');
      renderFaded = false;
    }
  }

  function placeCursor() {
    const existing = codeEl.querySelector('.hero-cursor');
    if (existing) existing.remove();
    const el = document.createElement('span');
    el.className = 'hero-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = ' ';
    codeEl.appendChild(el);
  }

  function typeChar() {
    if (!active) return;

    if (charIndex >= currentText.length) {
      schedule(beginFade, END_PAUSE_MS);
      return;
    }

    const cursor = codeEl.querySelector('.hero-cursor');
    const span = document.createElement('span');
    span.className = 'hero-char';
    span.textContent = currentText[charIndex];
    if (cursor) codeEl.insertBefore(span, cursor);
    else codeEl.appendChild(span);

    charIndex++;

    // Scroll the background container so the cursor stays in view.
    const bg = codeEl.parentElement;
    bg.scrollTop = bg.scrollHeight;

    if (charIndex % 5 === 0) updateRender();
    schedule(typeChar, CHAR_MS);
  }

  function beginFade() {
    if (!active) return;
    // Fade out both the code background and the render card together.
    codeEl.classList.add('is-fading');
    if (heroFgEl) {
      heroFgEl.classList.add('is-fading');
      renderFaded = true;
    }
    schedule(() => {
      codeEl.innerHTML = '';
      codeEl.classList.remove('is-fading');
      startSnippet();
    }, FADE_MS);
  }

  function startSnippet() {
    currentSnippet = pickNext(SNIPPETS, recentIds);
    recentIds.push(currentSnippet.id);
    if (recentIds.length > ANTI_REPEAT) recentIds.shift();

    currentText = currentSnippet.code;
    charIndex = 0;
    codeEl.innerHTML = '';
    codeEl.parentElement.scrollTop = 0;
    placeCursor();
    // Keep the card hidden (renderFaded=true) until first render update.
    if (iframe) renderPreview(iframe, '');
    schedule(typeChar, CHAR_MS);
  }

  document.addEventListener(SETTINGS_CHANGE_EVENT, () => {
    refreshThemeColors();
    updateRender();
  });

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!active) {
        active = true;
        codeEl.innerHTML = '';
        codeEl.classList.remove('is-fading');
        startSnippet();
      }
    } else {
      active = false;
      cancel();
    }
  }, { threshold: 0.1 });

  observer.observe(heroEl);
  startSnippet();
}
