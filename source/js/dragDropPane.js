/**
 * @file Drag-and-drop tile picker for mobile snippet input.
 *
 * Renders 3 tiles (1 correct answer + 2 distractors) and a drop zone.
 * Supports both mouse drag-and-drop (HTML5 DnD API) and touch drag.
 * Calls onCorrect(token) or onMistake() based on what is dropped.
 */

const FALLBACK_POOL = [
  'div', 'span', 'p', 'h2', 'ul', 'li',
  'color', 'margin', 'padding', 'border', 'flex', 'none', '16px', 'auto',
];

function pickOptions(correct, allTokens) {
  const others = allTokens.filter((t) => t !== correct);
  const candidates =
    others.length >= 2
      ? others
      : [...new Set([...others, ...FALLBACK_POOL.filter((t) => t !== correct)])];

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const distractors = [];
  for (const t of shuffled) {
    if (!distractors.includes(t)) {
      distractors.push(t);
      if (distractors.length === 2) break;
    }
  }

  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

/**
 * Mounts the drag-and-drop pane inside containerEl.
 *
 * @param {HTMLElement} containerEl - Element for tiles + drop zone (replaces keyboard-placeholder)
 * @param {string[]} allTokens - All snippet tokens in the current level (for distractor pool)
 * @param {function(string): void} onCorrect - Called with the token when the correct tile is dropped
 * @param {function(): void} onMistake - Called when the wrong tile is dropped
 * @returns {{ showNext: function(?string): void, destroy: function(): void }}
 */
export function initDragDropPane(containerEl, allTokens, onCorrect, onMistake) {
  let currentToken = null;
  let touchToken = null;
  let touchClone = null;

  const dropZone = document.createElement('div');
  dropZone.className = 'drag-drop-zone';
  dropZone.textContent = 'Drop here';

  const tilesRow = document.createElement('div');
  tilesRow.className = 'drag-drop-tiles';

  containerEl.innerHTML = '';
  containerEl.appendChild(dropZone);
  containerEl.appendChild(tilesRow);

  // ── Mouse DnD handlers on the drop zone ──────────────────────────────────

  function onDragOver(e) {
    if (!currentToken) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dropZone.classList.add('drag-over');
  }

  function onDragLeave() {
    dropZone.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleSubmit(e.dataTransfer.getData('text/plain'));
  }

  dropZone.addEventListener('dragover', onDragOver);
  dropZone.addEventListener('dragleave', onDragLeave);
  dropZone.addEventListener('drop', onDrop);

  // ── Shared submit logic ───────────────────────────────────────────────────

  function handleSubmit(token) {
    if (!currentToken) return;
    if (token === currentToken) {
      onCorrect(token);
    } else {
      onMistake();
    }
  }

  // ── Tile factory ──────────────────────────────────────────────────────────

  function makeTile(text) {
    const tile = document.createElement('div');
    tile.className = 'drag-drop-tile';
    tile.draggable = true;
    tile.textContent = text;

    // Mouse DnD
    tile.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', text);
      e.dataTransfer.effectAllowed = 'move';
      tile.classList.add('dragging');
    });
    tile.addEventListener('dragend', () => tile.classList.remove('dragging'));

    // Touch DnD
    tile.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        touchToken = text;
        const touch = e.touches[0];
        touchClone = tile.cloneNode(true);
        touchClone.classList.add('drag-clone');
        Object.assign(touchClone.style, {
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: '1000',
          width: `${tile.offsetWidth}px`,
          left: `${touch.clientX - tile.offsetWidth / 2}px`,
          top: `${touch.clientY - tile.offsetHeight / 2}px`,
          opacity: '0.85',
        });
        document.body.appendChild(touchClone);
        tile.classList.add('dragging');
      },
      { passive: false },
    );

    tile.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        if (!touchClone) return;
        const touch = e.touches[0];
        touchClone.style.left = `${touch.clientX - touchClone.offsetWidth / 2}px`;
        touchClone.style.top = `${touch.clientY - touchClone.offsetHeight / 2}px`;
        const r = dropZone.getBoundingClientRect();
        const over =
          touch.clientX >= r.left &&
          touch.clientX <= r.right &&
          touch.clientY >= r.top &&
          touch.clientY <= r.bottom;
        dropZone.classList.toggle('drag-over', over);
      },
      { passive: false },
    );

    tile.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        tile.classList.remove('dragging');
        dropZone.classList.remove('drag-over');
        if (touchClone) {
          touchClone.remove();
          touchClone = null;
        }
        const touch = e.changedTouches[0];
        const r = dropZone.getBoundingClientRect();
        const onZone =
          touch.clientX >= r.left &&
          touch.clientX <= r.right &&
          touch.clientY >= r.top &&
          touch.clientY <= r.bottom;
        if (onZone && touchToken) handleSubmit(touchToken);
        touchToken = null;
      },
      { passive: false },
    );

    return tile;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function showNext(token) {
    if (token === currentToken) return;
    currentToken = token;
    tilesRow.innerHTML = '';

    if (!token) {
      dropZone.textContent = '✓';
      return;
    }

    dropZone.textContent = 'Drop here';
    pickOptions(token, allTokens).forEach((t) => tilesRow.appendChild(makeTile(t)));
  }

  function destroy() {
    dropZone.removeEventListener('dragover', onDragOver);
    dropZone.removeEventListener('dragleave', onDragLeave);
    dropZone.removeEventListener('drop', onDrop);
    containerEl.innerHTML = '';
    currentToken = null;
  }

  return { showNext, destroy };
}
