# jsdom as a Dev Dependency for Unit Tests

## Status

Accepted

## Context and Problem Statement

`source/js/endScreen.js` is roughly 18 specs' worth of behavior, and most of those specs touch the DOM: `document.createElement`, `classList.add`, `setAttribute`, `innerHTML`, `appendChild`, `querySelector`, and `instanceof HTMLElement`. Jasmine itself is only the test framework (`describe`, `it`, `expect`); it does not supply a DOM. When `npm test` runs, it runs in Node, where `document` and `HTMLElement` do not exist, so any spec that touches the DOM blows up before its assertions execute.

The team also decided not to defer this coverage until end-to-end (E2E) testing is in place. E2E is further out, and shipping `endScreen.js` (plus the input pane and render pane work landing soon, which will face the same issue) without unit coverage means rendering bugs get caught only by a human eyeballing the running game. We need a DOM available during `npm test` now, not later.

This decision is scoped to *how* unit tests get a DOM. The decision to write unit tests for DOM-touching code at all is implicit in the Contributing Guide's test expectations.

## Decision Drivers

* Coverage of DOM-touching modules cannot wait for E2E to exist
* Tests should run via the same `npm test` entry point as everything else, with no extra runner or browser launcher in CI
* Test speed and developer feedback loop, since these specs will be re-run frequently as the input pane and render pane land
* Honesty of the tests: stubs that imitate the DOM end up testing the stubs rather than the real code paths
* Approval cost per the [Dependency Policy](../../CONTRIBUTING.md#dependency-policy): a new `devDependency` in `package.json` is allowed with team consensus, and `jsdom` is dev-only with no runtime shipping cost
* The pattern set here will be reused by upcoming input-pane and render-pane tests, so the choice is not specific to one file

## Considered Options

* **Add `jsdom` as a dev dependency** (chosen)
* **Switch to `jasmine-browser-runner`** (real headless browser)
* **Hand-stub the DOM in each test file**
* **Only test `formatElapsedTime`, drop the rest of the specs**
* **Refactor `endScreen.js` to separate pure logic from DOM rendering**

## Decision Outcome

Chosen option: **Add `jsdom` as a dev dependency**, because it is the conventional choice for exactly this case (Jasmine or Mocha in Node, code under test touches the DOM), the install is small (roughly 6 MB, dev-only, zero runtime cost), and tests continue to run through `npm test` with no separate runner, no browser launcher, and no CI changes. Because `jsdom` provides a real DOM implementation, the specs exercise the same `document.createElement`, `classList`, `appendChild`, and `instanceof HTMLElement` code paths that run in the browser, rather than asserting against fakes.

Setup will be a one-time addition: install `jsdom` as a `devDependency` in the root `package.json`, and add a small bootstrap (loaded via Jasmine's `helpers` config or imported at the top of each DOM-touching spec) that constructs a `JSDOM` instance and assigns `window`, `document`, and `HTMLElement` onto `globalThis` before specs run.

### Consequences

* Good: `endScreen.js` keeps its full ~18-spec coverage, including the rendering paths, instead of shrinking to only the one pure function
* Good: the same pattern works for the input pane and render pane tests that are next on the team's roadmap, so this is a one-time setup paying off across multiple modules
* Good: `npm test` stays the single command for unit tests; no second runner or CI job is needed
* Good: tests exercise real DOM APIs, so rendering bugs that depend on actual `classList` or `instanceof` behavior are catchable
* Neutral: adds one dev-only dependency to `package.json`; runtime bundle is unaffected because nothing ships to the browser
* Bad: `jsdom` is not a perfect browser, layout, real event loop semantics, and some newer Web APIs are absent or approximate, so a thin slice of bugs will still only be findable in a real browser (that gap is what E2E will eventually close)
* Bad: each DOM-touching spec needs the bootstrap import or a global helpers entry, a small but real piece of plumbing

## Pros and Cons of the Options

### Add `jsdom` as a dev dependency (chosen)

* Good, because it is the de-facto Node DOM for unit tests; most online answers for "Jasmine + DOM" assume this setup
* Good, because tests stay in `npm test` and CI requires no new job
* Good, because the install is dev-only and small, with no runtime footprint
* Good, because the bootstrap pattern generalizes to every future DOM-touching test the team will write
* Bad, because `jsdom` is not pixel- or layout-accurate; tests that depend on computed layout would still need a real browser
* Bad, because it is one more dependency to keep on a major-version cadence

### Switch to `jasmine-browser-runner` (real headless browser)

* Good, because the DOM is the actual browser DOM, so coverage is maximally faithful
* Good, because it doubles as a stepping stone toward E2E since a browser is already in the loop
* Bad, because it requires a separate config file, a browser launcher in CI, and a different command than `npm test`, which is a significant setup cost for one file's worth of tests today
* Bad, because CI runtime grows by the cost of spinning up a browser per run, which is a steep tax compared to `jsdom`'s startup
* Bad, because it conflates unit testing with browser-based testing, blurring the line that E2E is supposed to draw

### Hand-stub the DOM in each test file

* Good, because no new dependency, satisfies the strictest reading of a "no new deps" stance
* Bad, because every DOM API `endScreen.js` uses (`document.createElement`, `classList.add`, `setAttribute`, `innerHTML`, `appendChild`, `querySelector`, `instanceof HTMLElement`) has to be faked by hand
* Bad, because the specs end up asserting against the stubs' behavior rather than the real code paths, so they pass while the production code is subtly wrong
* Bad, because the stub surface grows with every new DOM method the source uses, creating ongoing maintenance for no real coverage gain
* Acceptable only as a fallback if the team adopts a hard "no new deps" rule

### Only test `formatElapsedTime`, drop the rest of the specs

* Good, because zero setup cost and zero new dependencies
* Bad, because `formatElapsedTime` is the only pure function in the file; dropping the other specs surrenders roughly 80% of the file's behavior to "no coverage until E2E"
* Bad, because the rendering bugs (wrong class added, wrong child appended, wrong attribute value) are exactly the kind of regression unit tests are best at catching cheaply
* Bad, because the same gap reappears for the input pane and render pane, so this is a strategy that does not scale

### Refactor `endScreen.js` to separate pure logic from DOM rendering

* Good, because the pure logic becomes trivially testable in Node with no extra dependency
* Good, because separation of concerns is generally a healthy direction for the code
* Bad, because it widens the scope from "add a test setup" to "redesign the module" right when the rest of the team is building on top of it
* Bad, because even after the refactor, the rendering layer itself remains untested by unit tests, so this does not actually solve the original problem, it just shrinks it
