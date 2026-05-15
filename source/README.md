# Source Code

This directory contains all game source code — vanilla HTML, CSS, and JavaScript with no build step required.

## Running Locally

The game uses native ES modules, which browsers refuse to load from `file://` URLs. Double-clicking `index.html` will appear to work but all imports will silently fail. Serve `source/` through a local static server instead:

```
# From the repo root, no install needed
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/` for the game or `http://localhost:8000/tests/` for the unit test runner. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension also works without npm or Node.js.

## Directory Structure

*Proposed — files marked here are planned; current state may be partial.*

```
source/
  index.html          — landing screen (difficulty select, game start)
  game.html           — main game screen
  css/
    reset.css
    main.css          — global styles and theme variables (light/dark)
    game.css          — game screen layout
  js/
    app.js            — bootstrap; wires modules together on DOMContentLoaded
    gameEngine.js     — game state, timer, coordination
    prompts.js        — manifest + pack loading, difficulty filtering, schema validation
    inputPane.js      — keystroke handling, character diff, error highlighting
    renderPane.js     — iframe updates
    metrics.js        — WPM, accuracy, and scoring calculations
    settings.js       — difficulty, sound, persistence via localStorage
    theme.js          — light/dark toggle, sets data-theme on <html>
  data/
    prompts/
      manifest.json   — index of available packs
      beginner.json   — (example) beginner difficulty prompts
      ...             — additional packs added here without touching JS
  assets/
    fonts/
    audio/
    images/
  tests/
    index.html        — Jasmine test runner (open in browser)
    gameEngine.test.js
    prompts.test.js
    metrics.test.js
    settings.test.js
```

`inputPane.js` is exercised via E2E tests rather than unit tests — see [`docs/testing.md`](../docs/testing.md).

## Architecture

See [`docs/architecture.md`](../docs/architecture.md) for the component diagram, data flow, and rationale behind the file organization.

## Testing

Unit tests live in `source/tests/` and run as standalone HTML in the browser — no test runner install needed. Open `http://localhost:8000/tests/` (with the static server above running) to run them. See [`docs/testing.md`](../docs/testing.md) for the full testing strategy.
