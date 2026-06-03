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

Then open `http://localhost:8000/` to play the game. Editor extensions like VS Code's Live Server also work. (Unit tests run in Node via `npm test`, not in the browser — see [Unit Testing](#unit-testing).)
Opening `index.html` directly by double-clicking will appear to load the page but all imports will silently fail.

### Module-Level Behavior
ES modules are strict mode by default and are deferred. Code that depends on the DOM does not need a `DOMContentLoaded` listener when run from a module script, but should not assume synchronous availability of other modules' side effects.

### Test Files
Test files import the modules they test, so they are modules themselves. They run in Node, not the browser: `npm test` invokes the Jasmine 5 CLI over `source/tests/**/*.test.js` (see [Unit Testing](#unit-testing)). The Jasmine runner supplies `describe`/`it`/`expect` as Node globals and discovers the specs, so no HTML runner or manual boot sequence is involved.

```js
// source/tests/metrics.test.js — a plain ES module that imports from ../js/
import { calculateWPM } from '../js/metrics.js';

describe('calculateWPM', () => {
  it('returns 0 when no time has elapsed', () => {
    expect(calculateWPM(100, 0)).toBe(0);
  });
});
```

Node has no DOM, so specs that touch `document`/`HTMLElement` build one with [jsdom](https://github.com/jsdom/jsdom) and assign it onto the globals before importing the module under test (see [ADR-009](decisions/009-jsdom-dev-dependency.md)):

```js
// source/tests/endScreen.test.js
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
```

### Enforcement

ESLint is configured with `sourceType: 'module'` and the rules below to keep module usage consistent:

| Rule | Why |
|------|-----|
| `import/extensions` set to `always` for `.js` | Enforce explicit extensions in import paths |
| `import/no-default-export` | Named exports only |
| `import/no-unresolved` | Catch typos and missing files |
| `no-restricted-syntax` against CommonJS (`require`, `module.exports`) | Project is browser-native ESM only |

Jasmine globals (`describe`, `it`, `expect`, `beforeEach`, `spyOn`, …) are provided by the Jasmine runner at runtime, not imported. Without telling ESLint about them, every test file fails `no-undef`. Scope the Jasmine env to test files only — production code should not be allowed to use `describe` as a free identifier:

```js
// eslint.config.mjs (flat config)
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

Unit tests run in Node via the [Jasmine](https://jasmine.github.io/) 5 CLI, added as a dev dependency. DOM-touching code gets a document from [jsdom](https://github.com/jsdom/jsdom), also a dev dependency (see [ADR-009](decisions/009-jsdom-dev-dependency.md)). Both are dev/CI-only, so the shipped game still has no runtime dependencies.

**Run:** `npm test` (`jasmine "source/tests/**/*.test.js"`)
**Test files:** `source/tests/*.test.js`
**Libraries:** Jasmine 5 (runner) and jsdom (DOM for browser-dependent specs)

Example test file structure:

```js
// source/tests/metrics.test.js
import { calculateWPM } from '../js/metrics.js';

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

From the repo root, install dev dependencies once, then run the suite:

```
npm install   # one-time, installs Jasmine and jsdom
npm test
```

`npm test` runs `jasmine "source/tests/**/*.test.js"` and prints the spec results to the terminal.

---

## HTML and CSS Validation

Static validation of `source/**/*.html` and `source/**/*.css` runs as a third parallel job in the PR quality check. ESLint covers JavaScript style and Jasmine covers JavaScript logic; this gate covers the markup and stylesheet half of the codebase that the other two ignore. See [ADR-008](decisions/008-html-css-validation.md) for the full rationale and tooling tradeoffs.

**Tools:**
- [`html-validate`](https://html-validate.org/) for HTML
- [`stylelint`](https://stylelint.io/) for CSS

Both are run via `npx --yes` so no repo dependency is added, matching the pattern from ADR-007.

### Running Locally

From the repo root:

```
npx --yes html-validate "source/**/*.html"
npx --yes stylelint "source/**/*.css"
```

Configuration lives in `.htmlvalidate.json` and `.stylelintrc.json` at the repo root, so local and CI runs apply the same rules.

### What Validation Catches

- Unclosed tags, mismatched tags, invalid nesting
- Missing required attributes (e.g., `<img>` without `alt`)
- Invalid CSS properties or values
- Duplicate selectors and unknown at-rules
- Common typos in property names

### What Validation Does Not Catch

Validators only inspect static files. HTML or CSS that the game generates at runtime (rendered by `renderPane.js` from typed user input, or injected by other modules) is not covered here, that remains an E2E concern.

---

## End-to-End Testing

E2E tests simulate a real user interacting with the game in a browser. They verify that all components work together correctly.

**Tool:** [Playwright](https://playwright.dev/), adopted as a dev dependency per [ADR-015](decisions/015-playwright-e2e.md). It is dev/CI-only, so the shipped game bundle is unaffected. Specs live in `e2e/` and the config is `playwright.config.js` at the repo root.

> **First target landed:** `renderPane.js` (a sandboxed iframe whose preview is written via `document.write`) is exercised by `e2e/render-pane.spec.js`. Its DOM/iframe functions (`createRenderPane`, `renderPreview`, `initRenderPane`) belong in E2E rather than the Jasmine suite; the one pure helper, `collectThemeColors` (with `refreshThemeColors`), is unit-tested in `source/tests/renderPane.test.js`.

### What to E2E Test

- Full game flow: land on index → select difficulty → type prompt → reach end screen
- Render pane updates correctly as the user types
- Error highlighting on incorrect characters during typing
- Progress bar and timer update live during play
- End screen shows correct final metrics
- Theme toggle switches between light and dark; theme cycle and other settings persist across reload
- Settings panel controls toggle, cycle, and round-trip through localStorage
- Mobile snippet view: typing only the `{{...}}` tokens, scaffold auto-fills
- Mode-aware tab locking (`css_only` / `html_only`) and next-level progression
- Accessibility smoke: landmarks, ARIA roles on the tab bar and settings dialog, basic keyboard navigation

### Spec layout

Specs live at `e2e/*.spec.js`. Shared helpers and fixtures live in `e2e/helpers/`; reusable test data (known level IDs and their canonical prompt strings) lives in `e2e/data/`.

Specs import `test` and `expect` from `e2e/helpers/fixtures.js` rather than from `@playwright/test` directly, which adds a `ui` fixture providing a locator tree bound to the page (so selector strings never appear in spec bodies). All other helpers (navigation, typing, settings seeding, constants, the `SEL` selector tree) come from `e2e/helpers/index.js`.

When adding a new spec:

- New CSS or data-testid selectors go in `e2e/helpers/selectors.js` first, then are referenced via `ui.<area>.<name>` from `e2e/helpers/locators.js`.
- A flow used by two or more specs is extracted into `e2e/helpers/navigation.js` or `e2e/helpers/typing.js`; one-off setup stays in the spec.
- Cross-cutting setup that two or more specs share can become a Playwright fixture in `e2e/helpers/fixtures.js`; one-off setup does not.
- New constants mirroring `source/js/settings.js` (storage key, enum lists, defaults) belong in `e2e/helpers/constants.js`.

### Running E2E Tests

```
# Install (one-time)
npm install
npx playwright install        # downloads browser binaries

# Run
npm run test:e2e                       # all browser projects locally
npx playwright test --project=chromium # Chromium only (matches CI)
npm run test:e2e:report                # open the HTML report after a run
```

The `playwright.config.js` `webServer` block launches the same static server contributors use (`python3 -m http.server --directory source 8000`) and waits for it before the suite runs, so no manual server start is needed.

E2E tests run on every PR via the `e2e-test` job in `.github/workflows/test.yml`. CI runs Chromium only; Firefox and WebKit projects are declared in the config for local cross-browser runs.

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

Unit tests run automatically on every PR via `.github/workflows/test.yml`, in parallel with ESLint (see [ADR-007](decisions/007-workflow.md)) and HTML/CSS validation (see [ADR-008](decisions/008-html-css-validation.md)). The workflow will be updated to run Playwright E2E tests once that dependency is approved.

Manually review the Actions tab after pushing to confirm tests are passing before requesting review.

---

## Deploy

The deploy workflow publishes the `source/` tree to GitHub Pages. Because there is no build step, **the entire `source/` directory is served as-is**, including the `source/tests/` spec files. These are now Node-only: they run via `npm test` and import the bare `jsdom` specifier, so they cannot execute in a browser and there is no test-runner page on the live site. The published `*.test.js` files are inert static text, not a live-site surface — no exclusion step is required.

### Generated API documentation

The JSDoc reference is generated from `source/js/` into `docs/api/` via `npm run docs`. The directory is a build artifact: gitignored, never hand-edited, and not yet wired into CI - it will be published alongside the game at `https://<site>/api/` once the deploy workflow is finalized (see [ADR-003](decisions/003-deployment-target.md)). Template choice and config live in [ADR-006](decisions/006-jsdoc-template.md); generation command and type syntax rules are in [CONTRIBUTING.md](../CONTRIBUTING.md#generating-api-documentation).