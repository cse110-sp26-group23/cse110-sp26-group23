# Agent Instructions

This file is the single source of AI agent instructions for this repo. It holds a short orientation plus links to the canonical documentation; the linked docs are the source of truth, so this file stays current as they change. See [ADR-014](docs/decisions/014-agents-md.md) for why it is structured this way.

## What this is

**Codekata** is a code typing game: the user types HTML/CSS prompts and watches the result render live in a side-by-side pane. It is a static web app built with **vanilla HTML, CSS, and JavaScript - no build step, no framework, no runtime dependencies** ([ADR-001](docs/decisions/001-tech-stack.md)).

Code lives in `source/` (`source/js/` for modules, `source/css/` for styles, `source/tests/` for unit tests). Documentation lives in `docs/` and `specs/`.

## Rules most likely to trip you up

- **Serve, don't open.** Native ES modules will not load from `file://`. Run `python3 -m http.server --directory source 8000` and open `http://localhost:8000/`. Double-clicking the HTML silently fails. Although, VSCode Live Preview works.
- **ES modules only** - no `require()`, no `module.exports`, no `exports.*`.
- **Named exports only** - no `export default`.
- **`===` over `==`**, `const`/`let` over `var`.
- **One ES module per feature**, wired by a thin per-page bootstrap (`app.js`, `game.js`); see [ADR-013](docs/decisions/013-feature-modules.md).
- **Branch from `dev`, not `main`.** PRs target `dev`; `main` is protected ([ADR-005](docs/decisions/005-branch-protection.md)). Branch names are kebab-case with a type prefix (`feat/`, `fix/`, `docs/`, `style/`, `refactor/`, `test/`, `chore/`).
- **Conventional Commits** for every commit message.
- **JSDoc on every exported function and class**, and a `@file` header on every file in `source/js/`.
- **No hardcoded CSS values** - use the theme tokens ([ADR-010](docs/decisions/010-hardcoded-values.md)).
- HTML and CSS are validated and JS is linted on every PR; fix all errors before pushing.

## Documentation

Read the relevant document before working in its area rather than relying on the summary above.

| Document | What it covers |
|---|---|
| [README](README.md) | Project overview and repository structure |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Local setup, branching, commit format, naming, JSDoc, linting, validation |
| [Architecture](docs/architecture.md) | Components, data flow, file structure |
| [Design](docs/design.md) | Personas, UCD flow, visual design principles |
| [Testing](docs/testing.md) | Unit/E2E strategy, CI/CD pipeline |
| [ADR Index](docs/decisions/README.md) | All architecture decision records |
| [User Stories](specs/user-stories/user-stories.md) | The product requirements driving the design |
