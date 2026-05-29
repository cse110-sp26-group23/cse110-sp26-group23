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
  beginnerFlexboxRow: Object.freeze({
    id: 'beginner-flexbox-row',
    mode: 'html_then_css',
    html: `<div class="row">
  <div class="box"></div>
  <div class="box"></div>
  <div class="box"></div>
</div>`,
    css: `.row { display: flex; gap: 8px; }
.box { width: 40px; height: 40px; background: purple; }`,
    htmlSnippets: Object.freeze(['row', 'box', 'box', 'box']),
    cssSnippets: Object.freeze(['flex', 'purple']),
  }),

  beginnerRecolor: Object.freeze({
    id: 'beginner-recolor',
    mode: 'css_only',
    css: `.box {
  background: purple;
  color: white;
  padding: 1rem;
}`,
  }),

  beginnerHeading: Object.freeze({
    id: 'beginner-heading',
    mode: 'html_only',
    html: `<h1>Hello, CSE 110!</h1>
<p>Welcome to the typing game.</p>`,
    // Prefix used by render-pane.spec.js to assert live iframe rendering.
    htmlPrefix: `<h1>Hello, CSE 110!</h1>`,
  }),

  intermediateProfileCard: Object.freeze({
    id: 'intermediate-profile-card',
  }),
});
