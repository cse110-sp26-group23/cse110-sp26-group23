/**
 * @file Known levels referenced by E2E specs.
 *
 * Each level here is pinned in the source prompt manifest
 * (source/data/prompts/<difficulty>.json). When a level's mode or canonical
 * content changes there, update the matching entry here once and every spec
 * that imports from it stays correct.
 *
 * `html` / `css` strings are what the player actually types in desktop mode
 * (snippet markers stripped). `htmlSnippets` / `cssSnippets` are the
 * {{...}} contents in typing order for mobile snippet mode.
 */

export const LEVELS = Object.freeze({
  beginnerNewsletter: Object.freeze({
    id: 'beginner-newsletter',
    mode: 'html_then_css',
    html: `<section class="signup">
  <h3>Stay in the loop</h3>
  <p>Get our weekly digest in your inbox.</p>
  <form>
    <label for="email">Email</label>
    <input id="email" type="email" placeholder="you@site.com">
    <button type="submit">Subscribe</button>
  </form>
</section>`,
    css: `.signup { font-family: sans-serif; max-width: 280px; }
.signup input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
}
.signup button {
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  background: #f97316;
  color: white;
  padding: 8px 18px;
  cursor: pointer;
}`,
    // Mobile snippet mode now marks exactly one token per line: the element
    // tag for HTML lines, the property (or sole value) for CSS lines. Keep
    // these in sync with the {{...}} markers in source/data/prompts/beginner.json.
    // The desktop `html`/`css` strings above are unaffected by this list.
    htmlSnippets: Object.freeze([
      'section', 'h3', 'p', 'form', 'label', 'input', 'button',
    ]),
    cssSnippets: Object.freeze([
      'sans-serif', 'width', 'padding', 'border', 'border-radius', 'box-sizing',
      'margin-top', 'border', 'border-radius', 'background', 'color', 'padding',
      'cursor',
    ]),
  }),

  beginnerSaleBadge: Object.freeze({
    id: 'beginner-sale-badge',
    mode: 'css_only',
    css: `.badge {
  display: inline-block;
  background: #f97316;
  color: white;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}`,
  }),

  beginnerBreakingNews: Object.freeze({
    id: 'beginner-breaking-news',
    mode: 'html_only',
    html: `<header class="masthead">
  <span class="badge">Breaking</span>
  <h1>City Unveils New Riverside Park</h1>
  <p class="lede">A long-awaited green space opens downtown this weekend.</p>
  <p class="meta">By Jordan Vale &middot; <time>June 3, 2026</time></p>
  <hr>
  <p>Officials promise trails, gardens, and room to breathe.</p>
  <a href="#story">Read the full story</a>
</header>`,
    // Prefix used by render-pane.spec.js to assert live iframe rendering;
    // ends just after the closing </h1> so the heading is renderable.
    htmlPrefix: `<header class="masthead">
  <span class="badge">Breaking</span>
  <h1>City Unveils New Riverside Park</h1>`,
  }),

  intermediateProductCard: Object.freeze({
    id: 'intermediate-product-card',
  }),
});
