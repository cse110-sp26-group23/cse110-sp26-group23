# Contributing to LeetCode James

## Local Development

No build step required. Clone the repo:

```
git clone https://github.com/cse110-sp26-group23/cse110-sp26-group23.git
```

After cloning, check out `dev` rather than `main`. Feature work branches from `dev` (see [Branching Convention](#branching-convention)).

The game uses native ES modules, which browsers refuse to load from `file://` URLs. **Do not** double-click `source/index.html`, it will appear to load but all imports will silently fail. Serve `source/` through a local static server:

```
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/` in any modern browser. The [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension is an equivalent zero-install alternative.

---

## Branching Convention

### Base Branch

All feature, fix, and chore branches are cut from `dev` and PRs target `dev`. The `main` branch only receives end-of-sprint release merges from `dev`. Per [ADR-005](docs/decisions/005-branch-protection.md), `main` is protected; do not push or PR directly to it.

### Prefixes

Branch prefixes mirror the Conventional Commits types used in commit messages, see the [Commit Message Format](#commit-message-format) section below.

| Prefix | Use for | Commit type |
|--------|---------|-------------|
| `feat/` | New features | `feat` |
| `fix/` | Bug fixes | `fix` |
| `docs/` | Documentation-only changes | `docs` |
| `style/` | Formatting, whitespace, no logic change | `style` |
| `refactor/` | Code restructuring with no behavior change | `refactor` |
| `test/` | Adding or updating tests | `test` |
| `chore/` | CI/CD, tooling, configuration, dependencies | `chore` |

`infra/` is accepted as an alias for `chore/` when the work is specifically about CI/CD or build infrastructure, but the commit message should still use `chore` as the Conventional Commits type.

Branch names use kebab-case: `feat/countdown-timer`, `fix/iframe-css-leak`, `chore/add-eslint`.

---

## Commit Message Format

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(game): add countdown timer to game screen
fix(render): prevent CSS from leaking out of iframe
docs(readme): add local development instructions
test(metrics): add unit tests for WPM calculation
chore(ci): add HTML validation step to lint workflow
```

- Use the imperative mood: "add" not "added", "fix" not "fixed"
- Keep the subject line under 72 characters
- Reference issues in the body or footer: `Closes #42`

---

## Naming Conventions

### Files
| Type | Convention | Example |
|------|-----------|---------|
| HTML | `kebab-case` | `game-screen.html` |
| CSS | `kebab-case` | `typing-pane.css` |
| JavaScript modules | `camelCase` | `gameEngine.js` |

### JavaScript
| Item | Convention | Example |
|------|-----------|---------|
| Variables and functions | `camelCase` | `calculateWPM` |
| Classes | `PascalCase` | `GameEngine` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_DIFFICULTY` |
| DOM IDs | `kebab-case` | `render-pane` |
| CSS classes | `kebab-case` | `typing-input` |

---

## Code Documentation

All exported functions and classes must have a JSDoc comment:

```js
/**
 * Calculates words per minute from character count and elapsed time.
 * @param {number} charCount - Total characters typed correctly
 * @param {number} elapsedSeconds - Time elapsed in seconds
 * @returns {number} WPM rounded to the nearest integer
 */
function calculateWPM(charCount, elapsedSeconds) {
  return Math.round((charCount / 5) / (elapsedSeconds / 60));
}
```

Inline comments explain the *why*, not the *what*. If a reader would understand it by reading the code, skip the comment.

### File Headers

Every file in `source/js/` starts with a JSDoc block using the `@file` tag. The header summarizes what the module owns, in enough detail that a reader can decide whether to keep reading without scanning the exports. If the module mixes pure logic and DOM-dependent code, note which parts are covered by unit tests vs. E2E tests so the testing boundary is obvious.

```js
/**
 * @file Render pane.
 *
 * Builds and updates the sandboxed iframe that displays the rendered
 * HTML/CSS the user has typed. Every public function here touches the
 * DOM or an iframe, so per docs/testing.md this module is covered by
 * Playwright E2E tests rather than Jasmine unit tests.
 */
```

Keep the header current. If the module's responsibilities change, update the header in the same PR.

### Generating API Documentation

One reason for requiring JSDoc on every exported function is so the team can compile the comments into a browsable HTML reference rather than relying on readers to grep through `source/js/`. Once `jsdoc` is TA-approved (see [Dependency Policy](#dependency-policy)), the team will use [`clean-jsdoc-theme`](https://www.npmjs.com/package/clean-jsdoc-theme) per [ADR-006](docs/decisions/006-jsdoc-template.md). Config lives in `jsdoc.config.json` at the repo root; generate with:

```
jsdoc -c jsdoc.config.json
```

This emits a static site at `docs/api/index.html` that can be opened directly in a browser (no static server needed, the generated pages are plain HTML, not modules).

Guidelines:
- **Do not commit `docs/api/`.** The output is fully derived from the source and would create noisy diffs on every JSDoc edit. It's already covered by `.gitignore`.
- **Regenerate on demand.** Treat `jsdoc -c jsdoc.config.json` like running tests, a local-and-CI step, not an artifact tracked in git.
- **Publish via CI.** Once [ADR-003](docs/decisions/003-deployment-target.md) (Deployment Target) is finalized, the deploy workflow can run `jsdoc` and publish `docs/api/` alongside the game so the reference is reachable at `https://<site>/api/`. Until then, generated docs are local-only.

If a function's JSDoc reads poorly in the generated output (missing `@param` types, undocumented `@returns`, no summary line), treat that as a lint failure on the doc itself, fix the comment, not the generator output.

---

## AI Usage Policy

AI-generated code is allowed but must be disclosed on every PR via the "AI Usage" field in the PR template. Describe:
- What was generated (e.g., "Claude generated the initial `calculateWPM` function")
- What was changed after generation (e.g., "updated the formula and added JSDoc")

Code must be understood and reviewed by the author before it is merged. Undisclosed AI usage is a violation of the team charter.

---

## Pull Request Process

1. Branch from `dev` using a prefix from the [Branching Convention](#branching-convention) above.
2. Keep PRs focused (one feature or fix per PR).
3. Every PR requires at least one peer approval before merge per [ADR-005](docs/decisions/005-branch-protection.md). Any team member can approve.
4. All three CI checks must pass before merge (see [PR Quality Check](#pr-quality-check) below).
5. Fill in all fields of the PR template, including the **AI Usage** field.
6. Resolve all review comments before merging.
7. Squash commits on merge to keep history clean.

---

## PR Quality Check

Every PR triggers `.github/workflows/test.yml`, which runs three jobs in parallel per [ADR-007](docs/decisions/007-workflow.md) and [ADR-008](docs/decisions/008-html-css-validation.md). All three must pass before merge.

| Job | What it checks | Local equivalent |
|-----|----------------|------------------|
| **ESLint** | JavaScript style and project rules | `npx --yes eslint@9 "source/**/*.js"` |
| **Jasmine** | Unit tests under `source/tests/**/*.test.js` | `npm test` (from `source/`) |
| **HTML/CSS Validation** | Markup and stylesheet correctness | see [Validation](#validation) below |

Run all three locally before pushing to avoid round-trips. Manual test results go in `docs/test-log.md` (per ADR-007) rather than blocking the merge.

A separate workflow, `.github/workflows/build.yml`, builds and pushes a Docker image to GHCR on pushes to `main` and `dev`. It is deployment infrastructure and not a contributor concern.

---

## Linting

ESLint runs automatically on every PR. To run locally with no install:

```
npx --yes eslint@9 "source/**/*.js"
```

Rules live in `eslint.config.mjs` at the repo root. Project-specific enforcement:
- **ES modules only**, no `require()`, no `module.exports`, no `exports.*`.
- **Named exports only**, no `export default` (see [testing.md](docs/testing.md) for why).
- **`===` over `==`**, `const`/`let` over `var`.
- Browser globals (`window`, `document`, `localStorage`, etc.) are declared; Jasmine globals (`describe`, `it`, `expect`, ...) are recognized in `source/tests/**`.

Fix all errors before pushing. Warnings (e.g., unused vars not prefixed with `_`) are allowed but should be cleaned up.

---

## Validation

HTML and CSS are validated on every PR via `html-validate` and `stylelint` per [ADR-008](docs/decisions/008-html-css-validation.md). Run locally before pushing:

```
npx --yes html-validate@9 "source/**/*.html"
npx --yes -p stylelint@16 -p stylelint-config-standard@36 stylelint "source/**/*.css"
```

Rules live in `.htmlvalidate.json` and `.stylelintrc.json` at the repo root. The CSS command takes the slightly longer form because stylelint needs the standard config preset resolvable alongside it; the wrapper used in CI handles the same setup.

Validators only check static files; runtime-generated markup is an E2E concern and is not currently gated.

---

## Testing

Unit tests use Jasmine 5 and live under `source/tests/**/*.test.js`. Run from the `source/` directory:

```
npm test
```

Or from the repo root with no install:

```
npx --yes jasmine "source/tests/**/*.test.js"
```

See [docs/testing.md](docs/testing.md) for the full testing strategy (unit, E2E once Playwright is approved, manual). Manual test results are logged in `docs/test-log.md`.

---

## Dependency Policy

- **Runtime dependencies** (anything shipped to the browser): require explicit TA approval and a new ADR in `docs/decisions/` before adding.
- **Dev-only tooling** (test runners, linters, validators, doc generators): preapproved when invoked via `npx --yes` with no repo install. Adding one as a `devDependency` in `source/package.json` (currently only Jasmine; ESLint, html-validate, and stylelint remain `npx`-only) requires team consensus on PR. No ADR is needed unless the choice itself is contentious.

The source code currently ships **zero runtime dependencies**.
