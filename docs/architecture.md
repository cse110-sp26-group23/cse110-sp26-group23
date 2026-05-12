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
The central coordinator. Manages game state (idle → active → paused → complete), loads prompts from the library, drives the timer, and coordinates the Input Pane, Render Pane, and Metrics Display.

### Prompt Library
Prompt content is stored as JSON data files, separate from game logic. Each pack is its own file; a manifest registers which packs are available so the Game Engine knows what to load. Adding a new prompt pack means adding a JSON file and updating the manifest — no changes to game code required.

_Exact schema and loading mechanism: TBD during implementation._

*Driven by: "different types of websites (prompts) to practice on"; "choose level of difficulty"; "clearly identify separate features and how to add new ones"*

### Metrics Display
Calculates and displays WPM, accuracy percentage, error count, and elapsed time. Summarized at the end of each round, including the final rendered result.

*Driven by: "metrics showing error rate, WPM, time"; "keys I am messing up more"; "final generated webpage at the end of the game"*

---

## Data Flow

1. User lands on the landing screen and selects a difficulty
2. Game Engine loads a prompt from the Prompt Library matching that difficulty
3. User begins typing in the Input Pane
4. On each keystroke:
   - Input Pane checks the character against the prompt and signals correct/error
   - Render Pane updates with the typed HTML/CSS so far
   - Metrics Display updates WPM, accuracy, and error count
5. Game ends when the user completes the prompt or time expires (countdown mode)
6. End screen displays the full metrics summary and the final rendered result

---

## Mobile Support

Mobile is a first-class concern. The layout must support both vertical and landscape orientations. Prompts shown on mobile should be scoped to shorter snippets (tags, keywords) appropriate for on-screen keyboard input.

*Driven by: "type small amounts of code on mobile"; "vertical or landscape modes"*

_Responsive layout strategy: TBD during UI implementation._

---

## Proposed File Structure

_This is a proposed structure, subject to change as implementation progresses._

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
    gameEngine.js     — game state, timer, prompt loading, coordination
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
    gameEngine.test.js
    metrics.test.js
    inputPane.test.js
    settings.test.js
```

*Driven by: "clearly identify separate features and how to add new ones"; "flowchart to visualize the overall architecture"*

---

## Code Quality Standards

All exported JavaScript functions and classes must include [JSDoc](https://jsdoc.app/) comments. This is a hard requirement per the course rubric.

Linting and automated style enforcement: _TBD — tooling and configuration will be documented here once decided._

*Driven by: "main documentation that specifies the coding practices/naming conventions"*

---

## Component Diagram

![Diagram](architecture_diagram.svg)

*Driven by: "flowchart to visualize the overall architecture"*

---

## CI/CD Pipeline

_Under development._ Deployment is automated via `.github/workflows/`. Pipeline steps (lint, test, deploy) will be documented here as the pipeline is built out.

---

## Testing

_Under development._ Unit and E2E testing are required and must be established early in the project, not only at the end. Testing tooling and coverage targets will be documented here as the infrastructure is set up.

*Driven by: "unit testing system so that as I implement features I can write tests alongside"*

---

## Key Decisions

See the [ADR index](decisions/README.md) for all major architectural decisions:

- [ADR-001](decisions/001-tech-stack.md) — Tech Stack (vanilla HTML/CSS/JS, no framework)
- [ADR-002](decisions/002-live-render-strategy.md) — Live Render Strategy (iframe isolation)
- [ADR-003](decisions/003-deployment-target.md) — Deployment Target _(decision pending)_
