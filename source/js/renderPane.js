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
    iframe.setAttribute('sandbox', '');
    iframe.classList.add('render-pane__iframe');
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

  iframe.srcdoc = buildIframeDocument(htmlCssString);
}

/**
 * Renders a hardcoded preview for the current prototype
 * @param {HTMLIFrameElement} iframe - Target iframe
 */
export function renderHardcodedPreview(iframe) {
  const hardcodedHtmlCss = `
    <style>
      .preview-card {
        border: 2px solid #333;
        border-radius: 12px;
        padding: 1rem;
        max-width: 320px;
      }

      .preview-card h1 {
        margin-top: 0;
        font-size: 1.5rem;
      }

      .preview-card button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
    </style>

    <section class="preview-card">
      <h1>Hello, CSE 110!</h1>
      <p>This preview is rendered from a combined HTML/CSS string.</p>
      <button>Example Button</button>
    </section>
  `;

  renderPreview(iframe, hardcodedHtmlCss);
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

  const iframe = createRenderPane(container);
  renderHardcodedPreview(iframe);

  return iframe;
}