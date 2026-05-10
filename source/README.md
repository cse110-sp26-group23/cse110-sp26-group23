# Source Code

This directory contains all game source code - vanilla HTML, CSS, and JavaScript with no build step required.

## Running Locally

Open `index.html` in any modern browser. No installation needed.

For the live render pane (iframe), serve through a local static file server to avoid browser security restrictions. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension works without npm or Node.js.

## Directory Structure

```
source/
  index.html            - landing screen (start game, select difficulty)
  game.html             - main game screen
  css/
    reset.css           - CSS reset
    main.css            - global styles and CSS custom properties (light/dark theme)
    game.css            - game screen layout (split pane, metrics bar)
  js/
    gameEngine.js       - game state machine, timer, prompt coordination
    inputPane.js        - keystroke handling, character diff, error highlighting
    renderPane.js       - iframe srcdoc updates for live render
    prompts.js          - prompt library (HTML/CSS exercises, organized by difficulty)
    metrics.js          - WPM, accuracy, and scoring calculations
  assets/
    fonts/              - monospace font for the code pane
    audio/              - sound effects (low priority user story)
    images/             - UI icons and imagery
  tests/
    index.html          - test runner (open in browser to run unit tests)
    *.test.js           - unit test files (one per JS module)
```

## Architecture

See [`docs/architecture.md`](../docs/architecture.md) for the component diagram, data flow, and rationale behind the file organization.

## Testing

Unit tests live in `source/tests/` and run as standalone HTML in the browser — no test runner install needed. Open `source/tests/index.html` to run them. See [`docs/testing.md`](../docs/testing.md) for the full testing strategy.
