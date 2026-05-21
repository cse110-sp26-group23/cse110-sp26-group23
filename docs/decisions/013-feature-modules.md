# JavaScript Organization as Per-Feature ES Modules

## Status

Accepted

## Context and Problem Statement

The game is built with vanilla JavaScript and no build step ([ADR-001](001-tech-stack.md)), so there is no bundler to manage dependencies between scripts. The app has several distinct concerns: game state, keystroke handling, the render iframe, metrics, the end screen, and settings. We need a way to organize this JavaScript so that each concern is self-contained, the wiring between concerns is explicit, and a contributor can find the code for a feature without reading the whole codebase. How should the JavaScript be split into files, and how should those files reference one another?

## Decision Drivers

* No build step is in use; scripts load directly in the browser ([ADR-001](001-tech-stack.md)).
* Each concern (engine, input, render, metrics, settings) should live in one file so its responsibilities are obvious.
* Dependencies between concerns should be explicit rather than relying on global variables or load-order.
* Pure logic must be importable in isolation so it can be unit tested under Jasmine ([ADR-009](009-jsdom-dev-dependency.md)).
* A contributor should be able to add a new feature by adding a file and wiring it in one place, per the user story "clearly identify separate features and how to add new ones".

## Considered Options

* A single monolithic script for the whole app
* Multiple plain `<script>` files sharing state through global variables
* One native ES module per feature, wired by a thin per-page bootstrap module

## Decision Outcome

Chosen option: **one native ES module per feature, wired by a thin per-page bootstrap module**, because it gives each concern a clear home, makes cross-feature dependencies explicit through `import` statements, and lets pure logic be imported directly into tests, all without a build step.

Each feature is a single file under `source/js/` (`gameEngine.js`, `inputPane.js`, `renderPane.js`, `metrics.js`, `endScreen.js`, `settings.js`). A module exposes its surface through **named exports only** (no `export default`) and depends on other features by importing their named exports.

Each HTML page has one **bootstrap module** as its entry point, loaded with `<script type="module">`: `app.js` for the landing screen (`index.html`) and `game.js` for the game screen (`game.html`). The bootstrap imports the feature modules it needs, and on `DOMContentLoaded` initializes and wires them together. The bootstrap is the only place that knows how the features fit together; the feature modules themselves stay unaware of one another beyond the functions they import.

Modules that mix pure logic with DOM/iframe access keep the pure helpers as separate named exports so they can be unit tested, while the DOM-dependent parts are covered by E2E tests (see [docs/testing.md](../testing.md)).

### Consequences

* Good, because each feature's responsibilities are contained in one file with an `@file` header, so a reader can locate code by concern.
* Good, because dependencies are explicit `import` statements rather than implicit globals or fragile `<script>` ordering.
* Good, because pure-logic exports can be imported directly into Jasmine specs without a DOM ([ADR-009](009-jsdom-dev-dependency.md)).
* Good, because adding a feature means adding a file and importing it in the relevant bootstrap, matching "clearly identify separate features and how to add new ones".
* Bad, because native ES modules will not load from `file://` URLs, so contributors must serve `source/` through a static server rather than double-clicking the HTML.
* Bad, because there is no bundling or minification; the browser fetches each module separately at runtime.

## Pros and Cons of the Options

### A single monolithic script

* Good, because there is only one file to load and no cross-file wiring to reason about.
* Bad, because all concerns are tangled in one file, making it hard to find or change a single feature.
* Bad, because there is no isolation boundary, so unit testing a single concern means loading everything.

### Multiple plain `<script>` files sharing global state

* Good, because it splits the code into per-feature files without requiring module syntax.
* Bad, because features communicate through global variables, making dependencies implicit and collisions likely.
* Bad, because correctness depends on the order of `<script>` tags in the HTML, which is easy to get wrong.
* Bad, because globals are awkward to import in isolation for unit tests.

### One native ES module per feature with a per-page bootstrap

* Good, because each feature is self-contained and its dependencies are declared with `import`.
* Good, because named exports can be imported directly into tests, and the bootstrap centralizes all wiring.
* Good, because it needs no build step, matching the vanilla-JS tech stack.
* Bad, because ES modules require serving over HTTP (no `file://`) and offer no bundling without a build tool.
