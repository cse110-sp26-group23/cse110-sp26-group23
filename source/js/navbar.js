/**
 * @file Site navigation bar.
 *
 * Defines the <site-nav> custom element. Renders the top navigation bar on
 * every page, highlighting the link that matches the current page via
 * aria-current="page". All behaviour is DOM-only; covered by Playwright E2E tests.
 */

/** @type {Array<{label: string, href: string}>} */
const NAV_LINKS = [
  { label: 'Play', href: 'game.html' },
  { label: 'Leaderboard', href: 'leaderboard.html' },
  { label: 'About', href: 'about.html' },
];

/**
 * Returns true if the given href corresponds to the currently loaded page.
 * @param {string} href - Page-relative href such as "index.html"
 * @returns {boolean}
 */
function isCurrentPage(href) {
  const path = window.location.pathname;
  if (href === 'index.html') {
    return path === '/' || path.endsWith('/index.html');
  }
  return path.endsWith('/' + href);
}

/** Top navigation bar, registered as &lt;site-nav&gt;. */
export class SiteNav extends HTMLElement {
  connectedCallback() {
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site navigation');

    const brand = document.createElement('a');
    brand.className = 'site-nav-brand';
    brand.href = 'index.html';
    brand.textContent = 'Codekata';

    const ul = document.createElement('ul');
    ul.className = 'site-nav-links';

    for (const { label, href } of NAV_LINKS) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'site-nav-link';
      a.href = href;
      a.textContent = label;
      if (isCurrentPage(href)) {
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      ul.appendChild(li);
    }

    nav.appendChild(brand);
    nav.appendChild(ul);
    this.appendChild(nav);
  }
}

customElements.define('site-nav', SiteNav);
