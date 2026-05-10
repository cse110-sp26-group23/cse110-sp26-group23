# Application Architecture

## Overview

The game is a single-page static web application with no back-end. All game state is managed client-side in vanilla JavaScript. There are no build tools, no server, and no external dependencies — the source files are served directly to the browser.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Game Screen                        │
│                                                         │
│  ┌──────────────────┐       ┌──────────────────────┐    │
│  │   Input Pane     │       │    Render Pane       │    │
│  │  (textarea /     │──────>│  (sandboxed iframe)  │    │
│  │   code editor)   │       │                      │    │
│  └──────────────────┘       └──────────────────────┘    │
│           │                                             │
│           v                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Game Engine                     │   │
│  │  - tracks game state (active, paused, complete)  │   │
│  │  - diffs user input against current prompt       │   │
│  │  - fires updates to Render Pane and Metrics      │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                     │
│         ┌─────────┴──────────┐                          │
│         v                    v                          │
│  ┌─────────────┐    ┌─────────────────┐                 │
│  │   Prompt    │    │    Metrics      │                 │
│  │   Library   │    │    Display      │                 │
│  │  (JSON data)│    │ WPM, accuracy,  │                 │
│  │             │    │ error count     │                 │
│  └─────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## Key Components

### Input Pane (`source/js/inputPane.js`)
Handles all user keyboard input. Compares each character typed against the expected prompt character and highlights errors in real time. Fires an event to the Game Engine on each valid keystroke.

### Render Pane (`source/js/renderPane.js`)
A sandboxed `<iframe>` that displays the rendered output of whatever HTML/CSS the user has typed so far. Updates its `srcdoc` attribute on each keystroke. Isolation prevents any user-typed CSS or JavaScript from affecting the parent page. See [ADR-002](decisions/002-live-render-strategy.md) for the rendering strategy decision.

### Game Engine (`source/js/gameEngine.js`)
The central coordinator. Manages game state (idle → active → paused → complete), loads prompts from the library, drives the timer, and passes user input to the render pane and metrics display.

### Prompt Library (`source/js/prompts.js`)
A static JavaScript module exporting an array of prompt objects. Each prompt has an id, difficulty level, title, and the target HTML/CSS string the user must type. Designed to be extended with new "packs" (HTML, CSS, JavaScript syntax sets) without modifying the game engine.

### Metrics Display (`source/js/metrics.js`)
Calculates and displays WPM, accuracy percentage, error count, and elapsed time. Updated by the Game Engine on each keystroke and summarized on the end screen.

---

## Data Flow

1. User lands on `source/index.html` and selects a difficulty
2. Game Engine loads a prompt from the Prompt Library matching the selected difficulty
3. User begins typing in the Input Pane
4. On each keystroke:
   - Input Pane checks the character against the prompt and signals correct/error
   - Game Engine passes the typed content so far to the Render Pane
   - Render Pane updates `iframe.srcdoc` with the typed HTML/CSS
   - Metrics Display updates WPM, accuracy, and error count
5. Game ends when the user completes the prompt or time expires (countdown mode)
6. End screen displays the full metrics summary and the rendered result

---

## File Structure

```
source/
  index.html          — landing screen (difficulty select, game start)
  game.html           — main game screen
  css/
    reset.css         — CSS reset
    main.css          — global styles and theme variables (light/dark)
    game.css          — game screen layout (split pane, metrics bar)
  js/
    gameEngine.js     — game state, timer, prompt loading, coordination
    inputPane.js      — keystroke handling, character diff, error highlighting
    renderPane.js     — iframe srcdoc updates
    prompts.js        — prompt library (HTML/CSS exercises by difficulty)
    metrics.js        — WPM, accuracy, and scoring calculations
  assets/
    fonts/            — monospace font for code pane
    audio/            — sound effects (optional, low priority user story)
    images/           — UI icons and imagery
  tests/
    index.html        — test runner (loads test files in browser)
    gameEngine.test.js
    metrics.test.js
```

---

## Deployment

Static files are served directly — no build step, no compilation. The deployed app is the `source/` directory. See [ADR-003](decisions/003-deployment-target.md) for the hosting decision (GitHub Pages vs Cloudflare Pages).

Deployment is automated via `.github/workflows/deploy.yml` and triggers on every merge to `main`.

---

## Key Decisions

See the [ADR index](decisions/README.md) for all major architectural decisions:

- [ADR-001](decisions/001-tech-stack.md) — Tech Stack (vanilla HTML/CSS/JS, no framework)
- [ADR-002](decisions/002-live-render-strategy.md) — Live Render Strategy (iframe isolation)
- [ADR-003](decisions/003-deployment-target.md) — Deployment Target
