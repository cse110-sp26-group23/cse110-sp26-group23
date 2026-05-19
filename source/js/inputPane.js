//default prompt content, can be overridden by passing custom HTML string to initInputPane()
const DEFAULT_PROMPT = `<style>
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
    </section>`;

const CLASS_MAP = {
  pending: "char-pending",
  correct: "char-correct",
  incorrect: "char-incorrect",
};

const CLASS_CURSOR = "char-cursor";

// ─── STATE ───────────────────────────────────────────────────────────────────
//     typed input string, cursor index, mistake tracking

let state = {
  promptText: "",
  typedText: "",
  mistakes: 0,
};

// Holds a reference to the prompt element so render() can update it in place
let promptEl = null;

// ─── RENDER ──────────────────────────────────────────────────────────────────
//     Builds the character-by-character overlay DOM from current state

// Replaces all prompt spans to reflect the latest typed state and cursor position\
function render() {
  if (!promptEl) return;

  const chars = compareText(state.promptText, state.typedText);
  const cursorIndex = state.typedText.length;

  promptEl.innerHTML = "";

  chars.forEach(({ char, status }, i) => {
    const span = document.createElement("span");
    span.className = CLASS_MAP[status];
    if (i === cursorIndex) {
      span.classList.add(CLASS_CURSOR);
    }

    if (char === "\n") {
      // Show ↵ so the cursor is visible, then break the line
      span.textContent = "↵";
      span.classList.add("char-newline");
      promptEl.appendChild(span);
      promptEl.appendChild(document.createElement("br"));
    } else {
      span.textContent = char;
      promptEl.appendChild(span);
    }
  });
}

// ─── INPUT HANDLING ──────────────────────────────────────────────────────────
//     keydown listener, backspace support, ignores modifier-only keys

/** Updates state on each keystroke and triggers a re-render
 * @param {KeyboardEvent} e - The keydown event object
 */
function handleKeyDown(e) {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  let char = null;

  if (e.key === "Backspace") {
    state.typedText = state.typedText.slice(0, -1);
    render();
    return;
  } else if (e.key === "Enter") {
    e.preventDefault();
    char = "\n";
  } else if (e.key === "Tab") {
    e.preventDefault();
    const pos = state.typedText.length;
    if (pos < state.promptText.length) {
      if (state.promptText[pos] === "\t") {
        char = "\t"; // falls through to normal char handling below
      } else if (state.promptText[pos] === " ") {
        // Smart indent: one Tab keypress advances past all consecutive spaces
        while (
          state.typedText.length < state.promptText.length &&
          state.promptText[state.typedText.length] === " "
        ) {
          state.typedText += " ";
        }
        render();
        return;
      } else {
        return; // Tab on non-whitespace does nothing
      }
    } else {
      return;
    }
  } else if (e.key === " ") {
    e.preventDefault();
    char = " ";
  } else if (e.key.length === 1) {
    char = e.key;
  }

  if (char !== null && state.typedText.length < state.promptText.length) {
    if (char !== state.promptText[state.typedText.length]) {
      state.mistakes += 1;
    }
    state.typedText += char;
    render();
  }
}

// ─── COMPARISON LOGIC ────────────────────────────────────────────────────────
//     Pure function: given (promptText, typedText) returns array of
//     { char, status } where status is 'correct' | 'incorrect' | 'pending'

// Compares typed text against prompt and returns a per-character status array

/** Compares typed text against prompt and returns a per-character status array
 * @param {string} promptText - The text to compare against
 * @param {string} typedText - The text that has been typed
 * @returns {Array<{char: string, status: string}>} - An array of character status objects
 */
function compareText(promptText, typedText) {
  return Array.from(promptText).map((char, i) => {
    if (i >= typedText.length) {
      return { char, status: "pending" };
    }
    return {
      char,
      status: typedText[i] === char ? "correct" : "incorrect",
    };
  });
}

// ─── INIT / EXPORT ───────────────────────────────────────────────────────────
//     init(containerEl, promptText) — mounts the pane into containerEl
//     reset() — clears typed input and re-renders
//     Export both

// Mounts the input pane into containerEl, sets the prompt, and begins capturing keystrokes
/** Initializes the input pane with the given container and prompt text
 * @param {string} selector - CSS selector for the container element
 * @param {string} promptText - The text to use as the typing prompt
 * @throws Will throw an error if the container element is not found
 * @throws Will throw an error if the container element is not an HTMLElement
 */
export function initInputPane(
  selector = "#code-pane",
  promptText = DEFAULT_PROMPT,
) {
  const containerEl = document.querySelector(selector);

  if (!containerEl) {
    throw new Error(`Input pane container not found: ${selector}`);
  }

  // Clear any previous pane and listener to prevent duplicates
  containerEl.innerHTML = "";
  document.removeEventListener("keydown", handleKeyDown);

  state = {
    promptText,
    typedText: "",
    mistakes: 0,
  };

  promptEl = document.createElement("div");
  promptEl.className = "code-pane-prompt";
  containerEl.appendChild(promptEl);

  document.addEventListener("keydown", handleKeyDown);

  render();
}

// Clears typed input and re-renders the pane to its initial untyped state
export function reset() {
  state.typedText = "";
  state.mistakes = 0;
  render();
}
