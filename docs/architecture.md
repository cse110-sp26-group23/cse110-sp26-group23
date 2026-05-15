# Application Architecture

## Overview

The game is a static web application with no back-end. All game state is managed client-side in vanilla JavaScript. There are no build tools, no server, and no external runtime dependencies.

The core experience is a **side-by-side code editor and live render pane**: the user types HTML/CSS snippets and watches a small webpage assemble in real time. This is less a traditional typing tutor and more a building/drawing game where the "canvas" is rendered HTML. Completing a prompt means you've constructed a working mini webpage. The Render Pane is the centerpiece of the experience.

See the [user stories](../specs/user-stories/user-stories.md) for the product decisions that shaped this architecture.

---

## Key Components

### Input Pane
Handles all user keyboard input. Compares each character typed against the expected prompt and highlights errors in real time.

*Driven by: "clear prompts and visible tracking progress"*

### Render Pane
A sandboxed `<iframe>` that displays the rendered output of whatever HTML/CSS the user has typed so far. Watching the webpage build itself as the user types is the primary game feedback loop. Sandboxing prevents any user-typed CSS or JavaScript from affecting the parent page.

See [ADR-002](decisions/002-live-render-strategy.md) for the rendering strategy decision.

*Driven by: "visualize the code in a small side-by-side container"*

### Game Engine
The central coordinator. Manages game state (idle <-> active <-> paused <-> complete), loads prompts from the library, drives the timer, and coordinates the Input Pane, Render Pane, and Metrics Display.

### Prompt Library
Prompt content is stored as JSON data files, separate from game logic. Each pack is its own file; a manifest registers which packs are available so the Game Engine knows what to load. Adding a new prompt pack means adding a JSON file and updating the manifest.

Loading is handled by `prompts.js`, which reads the manifest, fetches the requested pack, filters by difficulty, and validates the pack's structure before handing prompts to the Game Engine. Keeping this in a dedicated module isolates I/O and parsing from game state.

_Exact schema and loading mechanism: ADR-004._

*Driven by: "different types of websites (prompts) to practice on"; "choose level of difficulty"; "clearly identify separate features and how to add new ones"*

### Metrics Display
Calculates and displays WPM, accuracy percentage, error count, and elapsed time. Summarized at the end of each round, including the final rendered result.

*Driven by: "metrics showing error rate, WPM, time"; "keys I am messing up more"; "final generated webpage at the end of the game"*

---

## Data Flow

1. User lands on the landing screen and selects a difficulty and level
2. Game Engine loads the prompt with that difficulty
3. User begins typing in the Input Pane
4. On each keystroke:
   - Input Pane checks the character against the prompt and signals correct/error
   - Render Pane updates with the typed HTML/CSS so far
   - Metrics updates WPM, accuracy, and error count
5. Game ends when the user completes the prompt or time expires (countdown mode)
6. End screen displays the full metrics summary and the final rendered result

---

## Mobile Support

Mobile is a first-class concern. The layout must be designed to support vertical orientation. Prompts shown on mobile should be scoped to shorter snippets (tags, keywords) appropriate for on-screen keyboard input.

*Driven by: "type small amounts of code on mobile"; "vertical or landscape modes"*

_Responsive layout strategy: TBD during implementation._
_Mobile snippets: Described in ADR-004._

---

## Proposed File Structure

_This is a proposed structure, subject to change as implementation progresses._

```
source/
  index.html          - landing screen (difficulty select, game start)
  game.html           - main game screen
  css/
    reset.css
    main.css          - global styles and theme variables (light/dark)
    game.css          - game screen layout
  js/
    app.js            - bootstrap; wires modules together on DOMContentLoaded
    gameEngine.js     - game state, timer, coordination
    prompts.js        - manifest + pack loading, difficulty filtering, schema validation
    inputPane.js      - keystroke handling, character diff, error highlighting
    renderPane.js     - iframe updates
    metrics.js        - WPM, accuracy, and scoring calculations
    settings.js       - difficulty, sound, persistence via localStorage
    theme.js          - light/dark toggle, sets data-theme on <html>
  data/
    prompts/
      manifest.json   - index of available packs
      beginner.json   - (example) beginner difficulty prompts
      ...             - additional packs added here without touching JS
  assets/
    fonts/
    audio/
    images/
  tests/
    index.html        - Jasmine test runner (open in browser)
    gameEngine.test.js
    prompts.test.js
    metrics.test.js
    settings.test.js
```

*Driven by: "clearly identify separate features and how to add new ones"; "flowchart to visualize the overall architecture"*

---

## Code Quality Standards

All exported JavaScript functions and classes must include [JSDoc](https://jsdoc.app/) comments. This is a hard requirement per the course rubric.

JSDoc comments are also the source for the generated API reference, which is built from `source/js/` into `docs/api/` on demand and on every CI run. That output directory is a build artifact, gitignored, and never hand-edited. See [CONTRIBUTING.md, Generating API Documentation](../CONTRIBUTING.md#generating-api-documentation) for the command, and [ADR-005](decisions/005-jsdoc-template.md) for the template choice.

Linting and automated style enforcement: Included in [testing.md](./testing.md). HTML and CSS files are also validated in CI per [ADR-008](decisions/008-html-css-validation.md).

*Driven by: "main documentation that specifies the coding practices/naming conventions"*

---

## Component Diagram

![Diagram](architecture_diagram.svg)

*Driven by: "flowchart to visualize the overall architecture"*

---

## Testing & CI/CD

Unit testing, E2E testing, linting, and the GitHub Actions pipeline (lint, test, deploy via `.github/workflows/`) are all covered in [testing.md](./testing.md). Tests are written alongside features rather than added at the end, per the course rubric.

*Driven by: "unit testing system so that as I implement features I can write tests alongside"*

---

## Key Decisions

See the [ADR index](decisions/README.md) for all major architectural decisions.
