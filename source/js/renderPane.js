/**
 * @file Render pane.
 *
 * Builds and updates the sandboxed iframe that displays the rendered
 * HTML/CSS the user has typed. Every public function here touches the
 * DOM or an iframe, so per docs/testing.md this module is covered by
 * Playwright E2E tests rather than Jasmine unit tests.
 */

// Color/brand custom properties surfaced into the preview iframe so level CSS
// can reference them (e.g. `var(--brand-orange)`). Intentionally colors only:
// the typing-UI colors (--char-*, --cursor) and the spacing/type/radius scale
// are excluded so the built page does not couple to the app chrome. The iframe
// is a separate document and inherits none of these otherwise.
const PREVIEW_THEME_VARS = Object.freeze([
  '--brand-orange',
  '--brand-orange-strong',
  '--brand-orange-soft',
  '--brand-amber',
  '--brand-peach',
  '--bg',
  '--bg-gradient',
  '--surface',
  '--surface-alt',
  '--code-surface',
  '--text',
  '--muted',
  '--border',
  '--border-strong',
  '--danger',
  '--shadow-card',
  '--shadow-panel',
]);

// Cached `:root { ... }` snapshot of the active theme's color variables. Built
// from the parent's computed styles (so whichever data-theme is active resolves
// correctly) and refreshed only when the theme changes, not on every keystroke.
let themeVarsCss = '';

/**
 * Reads the active theme's color variables off the parent document into a
 * `:root { ... }` rule string. Uses computed values, so the currently selected
 * theme resolves without mirroring the data-theme attribute. Names that resolve
 * to nothing are skipped.
 * @param {HTMLElement} [root] - Element to read variables from (defaults to <html>).
 * @returns {string} A `:root { --x: val; ... }` rule, or '' when none resolve.
 */
export function collectThemeColors(root = document.documentElement) {
  if (typeof getComputedStyle !== 'function' || !root) {
    return '';
  }

  const styles = getComputedStyle(root);
  const declarations = PREVIEW_THEME_VARS
    .map((name) => [name, styles.getPropertyValue(name).trim()])
    .filter(([, value]) => value !== '')
    .map(([name, value]) => `  ${name}: ${value};`);

  return declarations.length ? `:root {\n${declarations.join('\n')}\n}` : '';
}

/**
 * Recomputes the cached theme-color snapshot from the parent document. Call
 * once on init and again whenever the active theme changes so the next render
 * carries the new palette.
 * @param {HTMLElement} [root] - Element to read variables from.
 */
export function refreshThemeColors(root = document.documentElement) {
  themeVarsCss = collectThemeColors(root);
}

/**
 * Builds a complete iframe document from a combined HTML/CSS string
 * @param {string} htmlCssString - Combined HTML/CSS content
 * @returns {string} Complete HTML document for iframe srcdoc
 */
function buildIframeDocument(htmlCssString) {
  // The theme-vars block comes first so the player's <style>/HTML (written into
  // <body> after it) can both use the variables and override them with its own
  // :root. The body baseline stays a plain white canvas by design.
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rendered Preview</title>
        <style data-theme-vars>${themeVarsCss}</style>
        <style>
          body {
              margin: 0;
              padding: 1rem;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
              background: white;
              color: #222;
          }
        </style>
      </head>
      <body>
        ${htmlCssString}
      </body>
    </html>
  `;
}

/**
 * Creates an iframe if one does not already exist inside the container
 * @param {HTMLElement} container - Element that should contain the iframe
 * @returns {HTMLIFrameElement} The render iframe
 */
export function createRenderPane(container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('createRenderPane expects an HTMLElement container.');
  }

  let iframe = container.querySelector('iframe');

  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.title = 'Code output preview';
    // allow-same-origin lets the parent write the typed HTML/CSS straight into
    // the frame's document (see renderPreview), which repaints immediately.
    // Re-assigning srcdoc on a fully sandboxed (opaque-origin) frame does not
    // reliably repaint until a relayout, which is why the preview previously
    // only refreshed when the view-mode switch resized the iframe. Scripts stay
    // disabled (no allow-scripts), so typed <script> tags still cannot run.
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.classList.add('render-pane-iframe');
    container.appendChild(iframe);
  }

  // Snapshot the current theme palette so the first render already carries it.
  refreshThemeColors();

  return iframe;
}

/**
 * Renders the given HTML/CSS string inside an iframe
 * @param {HTMLIFrameElement} iframe - Target iframe
 * @param {string} htmlCssString - Combined HTML/CSS string to render
 */
export function renderPreview(iframe, htmlCssString) {
  if (!(iframe instanceof HTMLIFrameElement)) {
    throw new Error('renderPreview expects an HTMLIFrameElement.');
  }

  const doc = iframe.contentDocument;

  // Writing into the live document repaints synchronously on every keystroke.
  // If the document is unreachable (e.g. an opaque-origin sandbox), fall back
  // to srcdoc so the preview still works, just without the live-update fix.
  if (doc) {
    doc.open();
    doc.write(buildIframeDocument(htmlCssString));
    doc.close();
  } else {
    iframe.srcdoc = buildIframeDocument(htmlCssString);
  }
}

/**
 * Initializes the render pane using a container selector
 * @param {string} selector - CSS selector for the render pane container
 * @returns {HTMLIFrameElement} Initialized iframe
 */
export function initRenderPane(selector = '#render-pane') {
  const container = document.querySelector(selector);

  if (!container) {
    throw new Error(`Render pane container not found: ${selector}`);
  }

  // The iframe starts empty; the input pane's first render emits the real
  // level content via renderPreview. Painting a placeholder here would flash
  // on screen during the async level load before that first render.
  return createRenderPane(container);
}