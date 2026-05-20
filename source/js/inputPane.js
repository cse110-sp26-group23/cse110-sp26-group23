// Default prompt content, split per tab. Override by passing custom strings to initInputPane().
const DEFAULT_PROMPTS = {
  html: `<section class="preview-card">
      <h1>Hello, CSE 110!</h1>
      <p>This preview is rendered from a combined HTML/CSS string.</p>
      <button>Example Button</button>
    </section>`,
  css: `.preview-card {
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
      }`,
};

// Order the tabs appear in the tab bar
const TAB_ORDER = ["html", "css"];
const TAB_LABELS = { html: "HTML", css: "CSS" };

const CLASS_MAP = {
  pending: "char-pending",
  correct: "char-correct",
  incorrect: "char-incorrect",
};

const CLASS_CURSOR = "char-cursor";

// ─── STATE ───────────────────────────────────────────────────────────────────
//     One tab is active at a time; each tab keeps its own typed input,
//     cursor position (derived from typedText length), and mistake count so
//     switching tabs preserves progress.

function makeTab(promptText = "") {
  return { promptText, typedText: "", mistakes: 0 };
}

let state = {
  activeTab: "html",
  tabs: {
    html: makeTab(),
    css: makeTab(),
  },
};

// Holds references so render() and switching can update them in place
let promptEl = null;
let viewportEl = null;
let tabButtons = {};

// Returns the tab object the user is currently typing into
function activeTab() {
  return state.tabs[state.activeTab];
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
//     Builds the character-by-character overlay DOM for the active tab

// Replaces all prompt spans to reflect the latest typed state and cursor position
function render() {
  if (!promptEl) return;

  const tab = activeTab();
  const chars = compareText(tab.promptText, tab.typedText);
  const cursorIndex = tab.typedText.length;

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

  scrollCursorIntoView();
}

// Scrolls the fixed-size viewport so the cursor stays visible: horizontally as
// the line grows past the right edge, vertically as typing moves down lines.
// scroll-behavior: smooth (set in CSS) animates each adjustment.
function scrollCursorIntoView() {
  if (!viewportEl || !promptEl) return;

  const cursor = promptEl.querySelector("." + CLASS_CURSOR);
  if (!cursor) return;

  const cRect = cursor.getBoundingClientRect();
  const vRect = viewportEl.getBoundingClientRect();

  // Breathing room so the upcoming character is already on screen
  const padX = 48;
  const padY = cRect.height || 24;

  let dx = 0;
  if (cRect.right > vRect.right - padX) {
    dx = cRect.right - (vRect.right - padX);
  } else if (cRect.left < vRect.left + padX) {
    dx = cRect.left - (vRect.left + padX);
  }

  let dy = 0;
  if (cRect.bottom > vRect.bottom - padY) {
    dy = cRect.bottom - (vRect.bottom - padY);
  } else if (cRect.top < vRect.top + padY) {
    dy = cRect.top - (vRect.top + padY);
  }

  // scrollLeft/scrollTop self-clamp to the valid range, so negatives are fine
  if (dx !== 0) viewportEl.scrollLeft += dx;
  if (dy !== 0) viewportEl.scrollTop += dy;
}

// Marks the given tab's button as selected and re-renders its prompt
function switchTab(tabName) {
  if (!state.tabs[tabName] || tabName === state.activeTab) return;

  state.activeTab = tabName;

  TAB_ORDER.forEach((name) => {
    const btn = tabButtons[name];
    if (btn) btn.setAttribute("aria-selected", String(name === tabName));
  });

  render();
}

// ─── INPUT HANDLING ──────────────────────────────────────────────────────────
//     keydown listener, backspace support, ignores modifier-only keys

/** Reports whether the most recently typed character is incorrect.
 * Because input is blocked after the first mistake, at most the last
 * character can ever be wrong.
 * @param {{promptText: string, typedText: string}} tab - The active tab state
 * @returns {boolean} True if the last typed character does not match the prompt
 */
function hasError(tab) {
  const i = tab.typedText.length - 1;
  return i >= 0 && tab.typedText[i] !== tab.promptText[i];
}

/** Updates the active tab's state on each keystroke and triggers a re-render
 * @param {KeyboardEvent} e - The keydown event object
 */
function handleKeyDown(e) {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const tab = activeTab();
  let char = null;

  if (e.key === "Backspace") {
    tab.typedText = tab.typedText.slice(0, -1);
    render();
    return;
  }

  // An uncorrected mistake locks all further input until it is backspaced away
  if (hasError(tab)) {
    if (e.key === "Tab" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
    }
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    char = "\n";
  } else if (e.key === "Tab") {
    e.preventDefault();
    const pos = tab.typedText.length;
    if (pos < tab.promptText.length) {
      if (tab.promptText[pos] === "\t") {
        char = "\t"; // falls through to normal char handling below
      } else if (tab.promptText[pos] === " ") {
        // Smart indent: one Tab keypress advances past all consecutive spaces
        while (
          tab.typedText.length < tab.promptText.length &&
          tab.promptText[tab.typedText.length] === " "
        ) {
          tab.typedText += " ";
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

  if (char !== null && tab.typedText.length < tab.promptText.length) {
    if (char !== tab.promptText[tab.typedText.length]) {
      tab.mistakes += 1;
    }
    tab.typedText += char;
    render();
  }
}

// ─── COMPARISON LOGIC ────────────────────────────────────────────────────────
//     Pure function: given (promptText, typedText) returns array of
//     { char, status } where status is 'correct' | 'incorrect' | 'pending'

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
//     initInputPane(selector, prompts) — mounts the tabbed pane into the container
//     reset() — clears typed input on every tab and re-renders

// Builds the tab bar and prompt element inside containerEl and begins capturing keystrokes
/** Initializes the tabbed input pane with the given container and prompts
 * @param {string} selector - CSS selector for the container element
 * @param {{html: string, css: string}} prompts - Per-tab prompt text
 * @throws Will throw an error if the container element is not found
 */
export function initInputPane(selector = "#code-pane", prompts = DEFAULT_PROMPTS) {
  const containerEl = document.querySelector(selector);

  if (!containerEl) {
    throw new Error(`Input pane container not found: ${selector}`);
  }

  // Clear any previous pane and listener to prevent duplicates
  containerEl.innerHTML = "";
  document.removeEventListener("keydown", handleKeyDown);

  state = {
    activeTab: "html",
    tabs: {
      html: makeTab(prompts.html ?? ""),
      css: makeTab(prompts.css ?? ""),
    },
  };

  // Tab bar: one button per tab, switches the active prompt on click
  tabButtons = {};
  const tabBar = document.createElement("div");
  tabBar.className = "code-pane-tabs";
  tabBar.setAttribute("role", "tablist");

  TAB_ORDER.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-pane-tab";
    btn.textContent = TAB_LABELS[name];
    btn.dataset.tab = name;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(name === state.activeTab));
    btn.addEventListener("click", () => switchTab(name));
    tabButtons[name] = btn;
    tabBar.appendChild(btn);
  });

  containerEl.appendChild(tabBar);

  // Fixed-size window that clips overflow; the prompt inside it scrolls
  viewportEl = document.createElement("div");
  viewportEl.className = "code-pane-viewport";

  promptEl = document.createElement("div");
  promptEl.className = "code-pane-prompt";
  viewportEl.appendChild(promptEl);
  containerEl.appendChild(viewportEl);

  document.addEventListener("keydown", handleKeyDown);

  render();
}

// Clears typed input on every tab and re-renders the pane to its initial untyped state
export function reset() {
  TAB_ORDER.forEach((name) => {
    state.tabs[name].typedText = "";
    state.tabs[name].mistakes = 0;
  });
  render();
}
