# Testing Strategy

## Philosophy

Tests must be written alongside features as they are built — not added at the end of the project. The course rubric requires early, verifiable testing effort visible in commit history. A new feature PR should include tests for the logic it introduces.

Test behavior, not implementation. Each test should express what a component is supposed to do, not how it does it internally.

---

## JS Modules
The project uses native ES modules with no bundler and no build step. This keeps the deployment story simple but introduces a few browser-specific rules that every contributor must follow.

### Loading Modules
Entry-point scripts should be loaded with `type="module"`:
```html
<script type="module" src="./app.js"></script>
```

Avoid a plain `<script src="...">` that will silently fail to parse import/export statements and break the page.

### Import Paths
Relative imports must include the `.js` extension. 

```js
// Correct
import { calculateWPM } from './metrics.js';

// Incorrect — browser will fail to resolve
import { calculateWPM } from './metrics';
```

Paths must start with `./`, `../`, or `/`. Bare specifiers (import x from 'lodash') are not supported.

### Exports
Use named exports. Default exports are not used.

```js
// metrics.js
export function calculateWPM(chars, seconds) { /* ... */ }
export function calculateAccuracy(correct, total) { /* ... */ }
```

Named exports are refactor-friendly, integrate with ESLint's `no-unused-vars` for imports, and avoid the rename-on-import ambiguity that default exports create. This is enforced by ESLint's `import/no-default-export` rule.

### Running Locally
Modules cannot be loaded from `file://` URLs. To run the game or the test runner locally, serve the `source/` directory through a static server:

```
# Built-in option, no install needed
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/` for the game or `http://localhost:8000/tests/` for unit tests. Editor extensions like VS Code's Live Server also work.
Opening `index.html` directly by double-clicking will appear to load the page but all imports will silently fail.

### Module-Level Behavior
ES modules are strict mode by default and are deferred. Code that depends on the DOM does not need a `DOMContentLoaded` listener when run from a module script, but should not assume synchronous availability of other modules' side effects.

### Test Files
Test files import the modules they test, so they are modules themselves.

Jasmine 5 ships as four classic scripts that must load in a specific order: `jasmine.js` (defines globals), `jasmine-html.js` (the reporter), `boot0.js` (sets up the env), and `boot1.js` (executes queued specs). The test modules need to register their `describe`/`it` calls *before* `boot1.js` runs, which is why `boot1.js` is loaded with `defer` — `type="module"` scripts are also deferred, so both wait for the DOM and then run in source order.

```html
<!-- source/tests/index.html -->
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/jasmine.css">
<script src="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/jasmine.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/jasmine-html.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/boot0.js"></script>

<!-- Test files as modules so they can `import` from ../js/ -->
<script type="module" src="./metrics.test.js"></script>
<script type="module" src="./prompts.test.js"></script>
<script type="module" src="./gameEngine.test.js"></script>

<!-- Must run AFTER all specs are queued; defer pairs with module scripts above -->
<script src="https://cdn.jsdelivr.net/npm/jasmine-core@5/lib/jasmine-core/boot1.js" defer></script>
```

Jasmine itself is loaded as a classic script (it attaches globals like `describe` and `it` to `window`), but each `*.test.js` file is a module so it can import from `../js/`.

Skipping `boot1.js` is a subtle failure mode: the page loads, no errors appear in the console, and zero specs run — so "tests pass" looks identical to "tests never ran." If the Jasmine reporter shows nothing, check that all four scripts are present.

### Enforcement

ESLint is configured with `sourceType: 'module'` and the rules below to keep module usage consistent:

| Rule | Why |
|------|-----|
| `import/extensions` set to `always` for `.js` | Enforce explicit extensions in import paths |
| `import/no-default-export` | Named exports only |
| `import/no-unresolved` | Catch typos and missing files |
| `no-restricted-syntax` against CommonJS (`require`, `module.exports`) | Project is browser-native ESM only |

Jasmine globals (`describe`, `it`, `expect`, `beforeEach`, `spyOn`, …) are injected at runtime by the classic `jasmine.js` script, not imported. Without telling ESLint about them, every test file fails `no-undef`. Scope the Jasmine env to test files only — production code should not be allowed to use `describe` as a free identifier:

```js
// eslint.config.js (flat config)
export default [
  { /* base config for source/js/** */ },
  {
    files: ['source/tests/**/*.test.js'],
    languageOptions: {
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly',
                 beforeEach: 'readonly', afterEach: 'readonly',
                 beforeAll: 'readonly', afterAll: 'readonly',
                 spyOn: 'readonly', xit: 'readonly', xdescribe: 'readonly' }
    }
  }
];
```

## Unit Testing

### Approach

*Proposed*

Since the project uses no npm dependencies, unit tests run as standalone HTML files that load a test library via CDN. No Node.js or build tools are needed — serve the test runner through a static server (see [JS Modules → Running Locally](#running-locally)) and open it in a browser.

**Test runner:** `source/tests/index.html`
**Test files:** `source/tests/*.test.js`
**Library:** [Jasmine](https://jasmine.github.io/) loaded via CDN

Example test file structure:

```js
// source/tests/metrics.test.js

describe('calculateWPM', () => {
  it('returns 0 when no time has elapsed', () => {
    expect(calculateWPM(100, 0)).toBe(0);
  });

  it('calculates correctly for standard input', () => {
    // 60 chars in 60 seconds = (60/5) / (60/60) = 12 WPM
    expect(calculateWPM(60, 60)).toBe(12);
  });
});
```

### What to Unit Test

Focus unit tests on pure logic that does not depend on the DOM:

| Module | What to test |
|--------|-------------|
| `metrics.js` | WPM calculation, accuracy calculation, error counting |
| `prompts.js` | Prompt loading, difficulty filtering, prompt structure validation |
| `gameEngine.js` | State transitions (idle → active → complete), timer logic |
| `settings.js` | Defaults, localStorage round-trips, recovery from missing/corrupt values |

DOM-dependent behavior — rendering, event wiring, and `inputPane.js` keystroke handling / error highlighting — is covered by E2E tests rather than unit tests.

### Running Unit Tests Locally

Tests must be served over HTTP because they load as modules. From the repo root:

```
python3 -m http.server --directory source 8000
```

Then open `http://localhost:8000/tests/` in any browser.

---

## End-to-End Testing

E2E tests simulate a real user interacting with the game in a browser. They verify that all components work together correctly.

**Tool:** [Playwright](https://playwright.dev/) — requires TA approval as a dev dependency before being added. Raise this at the next TA meeting.

### What to E2E Test

- Full game flow: land on index → select difficulty → type prompt → reach end screen
- Render pane updates correctly as user types
- Error highlighting appears on incorrect characters
- Metrics display updates during play
- End screen shows correct final metrics
- Theme toggle switches between light and dark

### Running E2E Tests

Once Playwright is approved and configured:

```
# Install (one-time, after TA approval)
npm install -D @playwright/test
npx playwright install

# Run
npx playwright test
```

E2E tests will be added to the `test.yml` GitHub Actions workflow once the setup is confirmed.

---

## Manual Testing

Manual tests are performed and documented for features that are difficult to automate, or to verify a new feature before it is merged.

**Log location:** `docs/test-log.md` (create when first used)

Each manual test entry must include:

| Field | Description |
|-------|-------------|
| Date | When the test was performed |
| Tester | GitHub username |
| Feature | What was tested |
| Browser | Chrome / Firefox / Safari / etc. |
| OS | Windows / macOS / Linux |
| Steps | What was done |
| Result | Pass / Fail / Partial |
| Notes | Any observed issues or edge cases |

---

## CI Integration

*Proposed*

Unit tests run automatically on every PR via `.github/workflows/test.yml`. The workflow will be updated to run Playwright E2E tests once the dependency is approved.

Manually review the Actions tab after pushing to confirm tests are passing before requesting review.

---

## Deploy

The deploy workflow publishes the `source/` tree to GitHub Pages. Because there is no build step, **the entire `source/` directory is served as-is** (including `source/tests/`.) That means `https://<site>/tests/` would be reachable on the live site and would pull the Jasmine CDN on every visit.

*ADR required for this!*

Two options:

1. **Leave it published.** Useful for graders/TAs who want to verify tests run in a real browser without cloning. Recommended unless there's a reason not to.
2. **Exclude `source/tests/` from the deploy artifact.** Add an exclusion step to `.github/workflows/deploy.yml` before the upload-pages-artifact step.

Whichever is chosen, document it here so future contributors don't get surprised when the runner appears (or doesn't) on the live URL.