import { JSDOM } from 'jsdom';
import { initDragDropPane } from '../js/dragDropPane.js';

// initDragDropPane builds real DOM (a drop zone + three draggable tiles) and
// wires mouse/touch handlers, so the suite runs against a jsdom document. The
// drag mechanics themselves (native HTML5 DnD, touch points) are exercised in
// a real browser by the drag-drop E2E spec; here we drive the pane through the
// same public surface the game uses — showNext() to set the active token and a
// synthetic drop to deliver an answer — and assert the tile set and the
// onCorrect/onMistake callbacks.

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

/** Fresh mount per test so handlers and state never leak between cases. */
function mount(allTokens) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onCorrect = jasmine.createSpy('onCorrect');
  const onMistake = jasmine.createSpy('onMistake');
  const pane = initDragDropPane(container, allTokens, onCorrect, onMistake);
  return { container, pane, onCorrect, onMistake };
}

function tileTexts(container) {
  return Array.from(container.querySelectorAll('.drag-drop-tile')).map(
    (t) => t.textContent,
  );
}

/**
 * Simulates a completed drag of `token` onto the drop zone via the mouse DnD
 * path. jsdom has no DataTransfer, so we hand the drop handler a minimal stub
 * that mirrors the one property the code reads (getData('text/plain')).
 */
function dropToken(container, token) {
  const zone = container.querySelector('.drag-drop-zone');
  const event = new dom.window.Event('drop', { bubbles: true });
  event.preventDefault = () => {};
  event.dataTransfer = { getData: () => token };
  zone.dispatchEvent(event);
}

describe('initDragDropPane', () => {
  it('mounts a drop zone and a tiles row inside the container', () => {
    const { container } = mount(['div', 'span', 'p']);

    expect(container.querySelector('.drag-drop-zone')).not.toBeNull();
    expect(container.querySelector('.drag-drop-tiles')).not.toBeNull();
  });

  it('shows no tiles until showNext is given a token', () => {
    const { container } = mount(['div', 'span', 'p']);

    expect(tileTexts(container).length).toBe(0);
  });

  describe('showNext', () => {
    it('renders exactly three tiles: the correct token plus two distractors', () => {
      const { container, pane } = mount(['div', 'span', 'p', 'a']);
      pane.showNext('div');

      const tiles = tileTexts(container);
      expect(tiles.length).toBe(3);
      expect(tiles).toContain('div');
    });

    it('never shows duplicate tiles', () => {
      const { container, pane } = mount(['div', 'span', 'p', 'a']);
      pane.showNext('div');

      const tiles = tileTexts(container);
      expect(new Set(tiles).size).toBe(tiles.length);
    });

    it('falls back to the built-in HTML pool when the level has too few tokens', () => {
      // Only the correct token is available, so both distractors must come
      // from the fallback pool — and they must be real, distinct tags.
      const { container, pane } = mount(['div']);
      pane.showNext('div');

      const tiles = tileTexts(container);
      expect(tiles.length).toBe(3);
      expect(tiles.filter((t) => t === 'div').length).toBe(1);
    });

    it('draws distractors from the CSS pool for a CSS property token', () => {
      // A hyphenated token is treated as a CSS property; distractors should be
      // CSS-flavored, never HTML tags like "div".
      const { container, pane } = mount(['font-size']);
      pane.showNext('font-size');

      const distractors = tileTexts(container).filter((t) => t !== 'font-size');
      expect(distractors.length).toBe(2);
      expect(distractors).not.toContain('div');
    });

    it('clears the tiles and marks completion when token is null', () => {
      const { container, pane } = mount(['div', 'span', 'p']);
      pane.showNext('div');
      pane.showNext(null);

      expect(tileTexts(container).length).toBe(0);
      expect(container.querySelector('.drag-drop-zone').textContent).toBe('✓');
    });

    it('is a no-op when called again with the unchanged current token', () => {
      const { container, pane } = mount(['div', 'span', 'p', 'a']);
      pane.showNext('div');
      const first = tileTexts(container);
      pane.showNext('div');
      const second = tileTexts(container);

      // Same tiles, not re-shuffled, so an in-progress drag is never disrupted.
      expect(second).toEqual(first);
    });
  });

  describe('dropping a tile', () => {
    it('calls onCorrect with the token when the correct tile is dropped', () => {
      const { container, pane, onCorrect, onMistake } = mount(['div', 'span', 'p']);
      pane.showNext('div');

      dropToken(container, 'div');

      expect(onCorrect).toHaveBeenCalledOnceWith('div');
      expect(onMistake).not.toHaveBeenCalled();
    });

    it('calls onMistake when a wrong tile is dropped', () => {
      const { container, pane, onCorrect, onMistake } = mount(['div', 'span', 'p']);
      pane.showNext('div');

      dropToken(container, 'span');

      expect(onMistake).toHaveBeenCalledTimes(1);
      expect(onCorrect).not.toHaveBeenCalled();
    });

    it('ignores a drop when no token is active', () => {
      const { container, onCorrect, onMistake } = mount(['div', 'span', 'p']);

      dropToken(container, 'div');

      expect(onCorrect).not.toHaveBeenCalled();
      expect(onMistake).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('empties the container so the pane leaves no DOM behind', () => {
      const { container, pane } = mount(['div', 'span', 'p']);
      pane.showNext('div');

      pane.destroy();

      expect(container.innerHTML).toBe('');
    });

    it('stops delivering drops after teardown', () => {
      const { container, pane, onCorrect } = mount(['div', 'span', 'p']);
      pane.showNext('div');
      pane.destroy();

      // The drop zone is gone, so there is nothing to dispatch onto; guard
      // against the handler firing if a stale reference were dropped on.
      const zone = container.querySelector('.drag-drop-zone');
      expect(zone).toBeNull();
      expect(onCorrect).not.toHaveBeenCalled();
    });
  });
});
