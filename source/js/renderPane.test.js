import {
  createRenderPane,
  renderPreview,
  renderHardcodedPreview,
  initRenderPane,
} from './renderPane.js';

describe('renderPane', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('createRenderPane', () => {
    test('creates an iframe inside the given container', () => {
      const container = document.createElement('section');

      const iframe = createRenderPane(container);

      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
      expect(container.querySelector('iframe')).toBe(iframe);
      expect(iframe.title).toBe('Code output preview');
      expect(iframe.hasAttribute('sandbox')).toBe(true);
      expect(iframe.classList.contains('render-pane__iframe')).toBe(true);
    });

    test('reuses an existing iframe instead of creating a new one', () => {
      const container = document.createElement('section');
      const existingIframe = document.createElement('iframe');
      container.appendChild(existingIframe);

      const iframe = createRenderPane(container);

      expect(iframe).toBe(existingIframe);
      expect(container.querySelectorAll('iframe')).toHaveLength(1);
    });

    test('throws an error when container is not an HTMLElement', () => {
      expect(() => {
        createRenderPane(null);
      }).toThrow('createRenderPane expects an HTMLElement container.');

      expect(() => {
        createRenderPane('not-an-element');
      }).toThrow('createRenderPane expects an HTMLElement container.');
    });
  });

  describe('renderPreview', () => {
    test('renders a combined HTML/CSS string into iframe srcdoc', () => {
      const iframe = document.createElement('iframe');

      const htmlCssString = `
        <style>
          h1 {
            font-size: 2rem;
          }
        </style>
        <h1>Hello Preview</h1>
      `;

      renderPreview(iframe, htmlCssString);

      expect(iframe.srcdoc).toContain('<!DOCTYPE html>');
      expect(iframe.srcdoc).toContain('<html lang="en">');
      expect(iframe.srcdoc).toContain('<title>Rendered Preview</title>');
      expect(iframe.srcdoc).toContain('<h1>Hello Preview</h1>');
      expect(iframe.srcdoc).toContain('font-size: 2rem');
    });

    test('includes default iframe body styling in srcdoc', () => {
      const iframe = document.createElement('iframe');

      renderPreview(iframe, '<p>Test</p>');

      expect(iframe.srcdoc).toContain('font-family: Arial, sans-serif');
      expect(iframe.srcdoc).toContain('background: white');
      expect(iframe.srcdoc).toContain('color: #222');
    });

    test('throws an error when target is not an iframe', () => {
      const div = document.createElement('div');

      expect(() => {
        renderPreview(div, '<p>Invalid target</p>');
      }).toThrow('renderPreview expects an HTMLIFrameElement.');
    });
  });

  describe('renderHardcodedPreview', () => {
    test('renders the hardcoded preview into the iframe', () => {
      const iframe = document.createElement('iframe');

      renderHardcodedPreview(iframe);

      expect(iframe.srcdoc).toContain('Hello, CSE 110!');
      expect(iframe.srcdoc).toContain('This preview is rendered from a combined HTML/CSS string.');
      expect(iframe.srcdoc).toContain('Example Button');
      expect(iframe.srcdoc).toContain('preview-card');
    });

    test('throws an error when passed a non-iframe target', () => {
      const div = document.createElement('div');

      expect(() => {
        renderHardcodedPreview(div);
      }).toThrow('renderPreview expects an HTMLIFrameElement.');
    });
  });

  describe('initRenderPane', () => {
    test('initializes the render pane using the default selector', () => {
      document.body.innerHTML = '<section id="render-pane"></section>';

      const iframe = initRenderPane();

      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
      expect(document.querySelector('#render-pane iframe')).toBe(iframe);
      expect(iframe.srcdoc).toContain('Hello, CSE 110!');
    });

    test('initializes the render pane using a custom selector', () => {
      document.body.innerHTML = '<section class="custom-render-pane"></section>';

      const iframe = initRenderPane('.custom-render-pane');

      expect(iframe).toBeInstanceOf(HTMLIFrameElement);
      expect(document.querySelector('.custom-render-pane iframe')).toBe(iframe);
      expect(iframe.srcdoc).toContain('Hello, CSE 110!');
    });

    test('throws an error when the render pane container is missing', () => {
      expect(() => {
        initRenderPane('#missing-render-pane');
      }).toThrow('Render pane container not found: #missing-render-pane');
    });
  });
});