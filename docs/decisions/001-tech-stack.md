# Tech Stack Selection

## Status

Accepted

## Context and Problem Statement

The team needs to choose a technology stack for building the code typing game. The game requires a code editor input area, a live render pane showing the typed HTML/CSS output, difficulty selection, and a metrics display. The stack must be approved under course technical constraints and deployable as a static site.

## Decision Drivers

* Course constraint: only standards-based HTML, CSS, and vanilla JavaScript are permitted without explicit TA approval
* No server-side processing is required (confirmed by Prof. Powell)
* Must be deployable to GitHub Pages or Cloudflare Pages
* Team has members experienced in vanilla JS and HTML/CSS; framework expertise is inconsistent across the team
* Minimal dependencies reduce maintenance burden and grading complexity

## Considered Options

* Vanilla HTML, CSS, and JavaScript (no build step)
* Vite + vanilla JavaScript
* React or Svelte

## Decision Outcome

Chosen option: "Vanilla HTML, CSS, and JavaScript", because it satisfies the course constraint with zero external dependencies, requires no build step, and can be opened directly in a browser or served from any static host.

### Consequences

* Good: no dependency approval needed, no build tooling to learn or maintain, trivially deployable
* Good: every team member can open and edit files without setup
* Bad: no module bundling — files must be organized carefully and loaded via `<script type="module">` or explicit `<script>` tags
* Bad: no hot module replacement during development; use VS Code Live Server or equivalent for auto-reload
* Bad: testing tools (Jest, Vitest) require TA approval as dev dependencies since they rely on Node.js

## Pros and Cons of the Options

### Vanilla HTML, CSS, and JavaScript

* Good, because zero dependencies and no build step
* Good, because fully within course technical constraints
* Good, because any browser can run it without setup
* Bad, because no bundler means manual management of script load order and module imports

### Vite + vanilla JavaScript

* Good, because fast dev server with hot module replacement
* Good, because ES module bundling handles script dependencies cleanly
* Bad, because requires Node.js and npm — needs TA approval as a dependency
* Bad, because adds a build artifact that must be deployed rather than the source directly

### React or Svelte

* Good, because component model is well-suited to the two-pane layout
* Bad, because framework overhead is unnecessary for an app of this scope
* Bad, because requires TA approval and introduces a steep learning curve for team members unfamiliar with the framework
