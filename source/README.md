# Source Code

This directory contains all game source code - vanilla HTML, CSS, and JavaScript with no build step required.

## Running Locally

Open `index.html` in any modern browser. No installation needed.

For the live render pane (iframe), serve through a local static file server to avoid browser security restrictions. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension works without npm or Node.js.

## Directory Structure

```
source/
  index.html          — landing screen (difficulty select, game start)
  game.html           — main game screen
  css/
    reset.css
    main.css          — global styles and theme variables (light/dark)
    game.css          — game screen layout
  js/
    gameEngine.js     — game state, timer, prompt loading, coordination
    inputPane.js      — keystroke handling, character diff, error highlighting
    renderPane.js     — iframe updates
    metrics.js        — WPM, accuracy, and scoring calculations
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
    gameEngine.test.js
    metrics.test.js
```

## Architecture

See [`docs/architecture.md`](../docs/architecture.md) for the component diagram, data flow, and rationale behind the file organization.

## Testing

Unit tests live in `source/tests/` and run as standalone HTML in the browser — no test runner install needed. Open `source/tests/index.html` to run them. See [`docs/testing.md`](../docs/testing.md) for the full testing strategy.
