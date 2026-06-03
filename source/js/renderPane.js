/**
 * @file Render pane.
 *
 * Builds and updates the sandboxed iframe that displays the rendered
 * HTML/CSS the user has typed. Every public function here touches the
 * DOM or an iframe, so per docs/testing.md this module is covered by
 * Playwright E2E tests rather than Jasmine unit tests.
 */

/**
 * Builds a complete iframe document from a combined HTML/CSS string
 * @param {string} htmlCssString - Combined HTML/CSS content
 * @returns {string} Complete HTML document for iframe srcdoc
 */
function buildIframeDocument(htmlCssString) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rendered Preview</title>
        <style>
          body {
            margin: 0;
            padding: 1rem;
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