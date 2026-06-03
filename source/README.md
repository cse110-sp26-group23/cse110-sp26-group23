# Source Code

This directory contains all game source code — vanilla HTML, CSS, and JavaScript with no build step required.

## Running Locally

The game uses native ES modules, which browsers refuse to load from `file://` URLs. Double-clicking `index.html` will appear to work but all imports will silently fail. Serve `source/` through a local static server instead:

```
# From the repo root, no install needed
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/` to play the game. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension also works. Unit tests do not run in the browser — see [Testing](#testing) below.

## Directory Structure

```
source/
  index.html          — landing screen (difficulty select, game start)
  game.html           — main game screen
  css/
    theme.css         — theme tokens and per-theme color variables (see ADR-011)
    main.css          — landing-screen layout and global styles
    game.css          — game-screen layout
    settings.css      — settings panel styles
  js/
    app.js            — landing-screen bootstrap; wires index.html on DOMContentLoaded
    game.js           — game-screen bootstrap; wires game.html on DOMContentLoaded (initializes renderPane, starts gameEngine)
    gameEngine.js     — game state, timer, coordination
    prompts.js        — manifest + pack loading, difficulty filtering, schema validation
    inputPane.js      — keystroke handling, character diff, error highlighting
    renderPane.js     — sandboxed iframe preview (theme-variable injection)
    endScreen.js      — end-of-round metrics screen
    metrics.js        — WPM, accuracy, and scoring calculations
    progress.js       — per-level completion tracking via localStorage
    snippets.js       — mobile {{...}} snippet parsing/masking
    settings.js       — difficulty, sound, theme, view mode; persistence via localStorage
    time.js           — timer / countdown
    audio.js          — sound effects
  data/
    prompts/
      manifest.json   — index of available packs
      beginner.json   — beginner difficulty levels
      intermediate.json — intermediate difficulty levels
      expert.json     — expert difficulty levels
  assets/
    fonts/
    audio/
    images/
  tests/              — one *.test.js per module; run with `npm test` (Jasmine 5)
```

The DOM-heavy parts of `inputPane.js` are exercised via E2E tests rather than unit tests — see [`docs/testing.md`](../docs/testing.md).

## Architecture

See [`docs/architecture.md`](../docs/architecture.md) for the component diagram, data flow, and rationale behind the file organization.

## Testing

Unit tests live in `source/tests/` and run in Node via Jasmine 5. From the repo root, `npm install` once, then `npm test`. DOM-touching specs spin up a [jsdom](https://github.com/jsdom/jsdom) document (see [ADR-009](../docs/decisions/009-jsdom-dev-dependency.md)). See [`docs/testing.md`](../docs/testing.md) for the full testing strategy.
