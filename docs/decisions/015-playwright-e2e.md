# Playwright for End-to-End Testing

## Status

Accepted

## Context and Problem Statement

The unit suite (Jasmine over `jsdom`, see [ADR-009](009-jsdom-dev-dependency.md)) covers pure logic and DOM-touching modules that can be exercised against a simulated DOM. It deliberately stops short of two things: behavior that depends on a real browser (layout, real event loop, iframe boundaries, computed styles) and the cross-component flow a real player walks through. [ADR-009](009-jsdom-dev-dependency.md) names that residual gap explicitly and says E2E is what eventually closes it.

That gap is now concrete. `renderPane.js` renders previews into an `<iframe>`, and every public function in it (`createRenderPane`, `renderPreview`, `renderHardcodedPreview`, `initRenderPane`) is DOM/iframe interaction. `jsdom` does not implement iframe content-document semantics faithfully, so these functions cannot be tested honestly in the unit suite, and `renderPane.js` currently has zero automated coverage. The same is true for `inputPane.js` keystroke handling and error highlighting, and for the full play-through (land → pick difficulty → type prompt → end screen). We need a real-browser test layer and a tool to drive it.

This decision is scoped to *which tool* drives the browser for E2E. That E2E should exist at all is already settled in [docs/testing.md](../testing.md) and the Contributing Guide's test expectations.

## Decision Drivers

* **Real-browser fidelity.** The whole point of this layer is to catch what `jsdom` cannot: iframe content documents, layout-dependent rendering, real keyboard events, and computed-style assertions for the theme toggle.
* **Cross-browser coverage.** The game ships to GitHub Pages for arbitrary visitors; bugs that only appear in Firefox or WebKit should be catchable without three separate setups.
* **Headless CI fit.** Tests must run unattended in `.github/workflows/test.yml`, in parallel with the existing ESLint, Jasmine, and HTML/CSS-validation jobs (see [ADR-007](007-workflow.md) and [ADR-008](008-html-css-validation.md)).
* **No-build / static-server reality.** The project is browser-native ESM with no bundler; modules only load over HTTP (see [docs/testing.md](../testing.md#running-locally)). The runner must be able to serve `source/` and wait for it before the suite starts.
* **Flake resistance.** A typing game updates the DOM asynchronously on every keystroke; a runner with built-in auto-waiting avoids the `sleep`-and-pray retries that make E2E suites flaky and slow.
* **Dependency-policy cost.** Per the [Dependency Policy](../../CONTRIBUTING.md#dependency-policy), a new dev dependency needs team consensus, and a runtime browser dependency for CI needs TA sign-off. The lighter the install and config footprint, the lower that cost.

## Considered Options

* **Playwright (`@playwright/test`)** (chosen)
* **Cypress**
* **Selenium WebDriver**
* **Puppeteer**
* **No E2E tool — rely on manual testing only**

## Decision Outcome

Chosen option: **Playwright via `@playwright/test`**, because it is the only option that satisfies every driver at once: it drives Chromium, Firefox, and WebKit from a single config; it ships its own test runner with auto-waiting and tracing built in; it runs headless in CI with no display server; its `webServer` config can launch `python3 -m http.server --directory source 8000` and block until the page responds, which matches our no-build static-serve story exactly; and its first-class iframe support (`page.frameLocator`) is precisely what `renderPane.js` needs.

`renderPane.js` is the first target for the suite once Playwright lands. Setup is a one-time addition gated on TA approval (raise at the next TA meeting, per the note in [docs/testing.md](../testing.md#end-to-end-testing)):

```
# After TA approval
npm install -D @playwright/test
npx playwright install        # downloads browser binaries

# Run
npx playwright test
```

A `playwright.config.js` at the repo root will declare the `webServer` (the static server above), the `baseURL` (`http://localhost:8000`), and the browser projects. Specs live under a top-level `e2e/` (or `tests/e2e/`) directory, kept separate from `source/tests/` so the Jasmine glob (`source/tests/**/*.test.js`) and the Playwright glob never overlap. The `test.yml` workflow gains a job that installs the browser binaries (cached) and runs `npx playwright test` once the config is confirmed.

This decision does **not** add a runtime dependency to the shipped game; `@playwright/test` and the browser binaries are dev/CI-only and nothing reaches the GitHub Pages artifact.

### Consequences

* Good: the `renderPane.js` iframe coverage gap and the full play-through flow become testable in a real browser, closing the exact hole [ADR-009](009-jsdom-dev-dependency.md) left open.
* Good: cross-browser runs (Chromium/Firefox/WebKit) come from one config instead of three driver setups.
* Good: auto-waiting and the trace viewer make the async, keystroke-driven assertions reliable and debuggable, and traces/screenshots on failure are useful CI artifacts.
* Good: `webServer` config reuses the same static-serve command contributors already run locally, so local and CI behavior match.
* Neutral: adds one dev dependency plus downloaded browser binaries; CI caches the binaries, and the runtime bundle is unaffected.
* Bad: browser-binary download (hundreds of MB) makes the E2E job meaningfully slower and heavier than the existing lint/unit jobs; it runs as a separate cached job rather than inline.
* Bad: E2E specs are inherently slower and more failure-prone than unit specs; they are reserved for cross-component flows and real-browser-only behavior, not logic that the Jasmine suite already covers cheaply.
* Bad: requires TA approval before it can be merged, so the suite is blocked until that sign-off lands.

## Pros and Cons of the Options

### Playwright (chosen)

* Good, because one config drives Chromium, Firefox, and WebKit headlessly, covering the browsers real visitors use.
* Good, because the bundled `@playwright/test` runner gives auto-waiting, parallelism, fixtures, and tracing without assembling a runner + assertion library + waiting helpers separately.
* Good, because first-class iframe support (`frameLocator`) directly fits `renderPane.js`, the suite's first target.
* Good, because the `webServer` option launches and waits on our existing static-serve command, fitting the no-build ESM setup with no extra glue.
* Good, because it is designed for headless CI and is straightforward to wire into `test.yml` as a parallel job.
* Bad, because the browser-binary install is large and slows the E2E CI job relative to the lint/unit jobs.
* Bad, because it is a heavier dependency that needs TA approval before adoption.

### Cypress

* Good, because it has an excellent interactive debugging UI and a gentle authoring experience.
* Good, because auto-waiting and retry-ability reduce flake, similar to Playwright.
* Bad, because WebKit/Safari support is experimental and historically weaker, so cross-browser coverage is not first-class.
* Bad, because its runtime model (tests execute inside the browser) makes some cross-origin and iframe scenarios awkward, which is risky given the `renderPane.js` iframe is the primary target.
* Bad, because it is a larger, more opinionated install for the same outcome Playwright reaches more directly.

### Selenium WebDriver

* Good, because it is the long-standing industry standard with the widest language and browser support.
* Bad, because it ships only the driver: a test runner, assertion library, and explicit waiting strategy must all be assembled and maintained by the team.
* Bad, because the lack of built-in auto-waiting pushes contributors toward manual sleeps, the classic source of E2E flake.
* Bad, because driver/browser version management is extra operational overhead for a student project.

### Puppeteer

* Good, because it is lightweight and well documented for headless automation.
* Good, because it shares lineage with Playwright, so the API feels familiar.
* Bad, because it is Chromium-first; Firefox is limited and WebKit is unsupported, so cross-browser coverage is lost.
* Bad, because it is an automation library, not a test framework, so it needs a separate runner and assertion layer bolted on, much like Selenium.

### No E2E tool — rely on manual testing only

* Good, because zero new dependencies and no TA approval needed; manual testing is already documented in [docs/testing.md](../testing.md#manual-testing).
* Bad, because `renderPane.js` and the full play-through stay permanently uncovered by automation, so iframe and integration regressions are caught only when a human happens to notice.
* Bad, because manual runs are not enforced on every PR, so coverage silently decays as the game grows.
* Bad, because it leaves the gap [ADR-009](009-jsdom-dev-dependency.md) explicitly promised E2E would close, contradicting an already-accepted decision.

*An important note is that manual testing is still required. This is a game and not everything can be automated, we will also need to come up with 'human test scripts' that specify how people should test the page.*