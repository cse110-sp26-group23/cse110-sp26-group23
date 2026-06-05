/**
 * @file Site footer.
 *
 * Defines the <site-footer> custom element. Renders the thin bottom bar on
 * every page with policy/info links on the left and the source code link on
 * the right. All behaviour is DOM-only; covered by Playwright E2E tests.
 */

/** @type {Array<{label: string, href: string}>} */
const FOOTER_LINKS = [
  { label: 'Privacy Policy', href: 'privacy.html' },
  { label: 'Terms of Service', href: 'terms.html' },
];

/** GitHub repository URL for the source code link. */
const REPO_URL = 'https://github.com/cse110-sp26-group23/cse110-sp26-group23';

/** Site footer bar, registered as &lt;site-footer&gt;. */
export class SiteFooter extends HTMLElement {
  connectedCallback() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';

    const left = document.createElement('div');
    left.className = 'site-footer-left';

    const brand = document.createElement('a');
    brand.className = 'site-footer-brand';
    brand.href = 'index.html';

    const brandMark = document.createElement('img');
    brandMark.className = 'site-footer-mark';
    brandMark.src = 'assets/images/brand/codekata-mark.svg';
    brandMark.alt = '';
    brandMark.setAttribute('aria-hidden', 'true');
    brandMark.width = 20;
    brandMark.height = 20;

    const brandWordmark = document.createElement('span');
    brandWordmark.className = 'site-footer-wordmark';
    brandWordmark.textContent = 'codekata';

    brand.appendChild(brandMark);
    brand.appendChild(brandWordmark);

    const linksNav = document.createElement('nav');
    linksNav.className = 'site-footer-links';
    linksNav.setAttribute('aria-label', 'Footer navigation');

    for (const { label, href } of FOOTER_LINKS) {
      const a = document.createElement('a');
      a.className = 'site-footer-link';
      a.href = href;
      a.textContent = label;
      linksNav.appendChild(a);
    }

    const source = document.createElement('a');
    source.className = 'site-footer-source';
    source.href = REPO_URL;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = '</> Source Code';

    left.appendChild(brand);
    left.appendChild(linksNav);
    footer.appendChild(left);
    footer.appendChild(source);
    this.appendChild(footer);
  }
}

customElements.define('site-footer', SiteFooter);
