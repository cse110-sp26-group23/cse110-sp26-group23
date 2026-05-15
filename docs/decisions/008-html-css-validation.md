# HTML and CSS Validation in PR Quality Check

## Status

Accepted

## Context and Problem Statement

[ADR-007](007-workflow.md) set up the PR quality check with two parallel jobs: ESLint for JavaScript style and Jasmine for unit tests. Neither covers the markup or stylesheet files, even though the game is roughly half HTML and CSS by surface area. A malformed tag, an unclosed block, an invalid CSS property, or a typo in a selector currently slips past CI and surfaces only at runtime in the Render Pane, often as silent failure rather than a visible error.

We need a third gate that validates HTML and CSS on every PR, fitting the same constraints as the existing two: no repo dependencies, fast, parallelizable.

## Decision Drivers

* Catches markup and stylesheet errors before they reach the Render Pane
* No new repo dependencies; runs via `npx --yes` like the existing ESLint and Jasmine jobs
* Runs in parallel with lint and unit tests so total gate time stays at `max(jobs)`
* Configurable enough to silence false positives on intentional patterns (e.g., the Jasmine test runner's classic-script tags)
* Tooling that the team can run locally with the same one-liner used in CI

## Considered Options

* **`html-validate` plus `stylelint` via `npx`** (chosen)
* **W3C Nu Html Checker (`vnu`)**
* **`html-validate` only, defer CSS validation**

## Decision Outcome

Chosen option: **`html-validate` plus `stylelint` via `npx`**, because both run with zero repo install (matching the existing ESLint and Jasmine pattern), both are configurable enough to handle the intentional CDN script tags in `source/tests/index.html`, and together they cover the two file types the game produces. Running them as a single third job keeps the workflow change small while still executing in parallel with lint and unit tests at the workflow level.

Proposed workflow shape (added to `.github/workflows/test.yml` once accepted):

```yaml
validate:
  name: HTML/CSS Validation
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Validate HTML
      run: npx --yes html-validate "source/**/*.html"
    - name: Validate CSS
      run: npx --yes stylelint "source/**/*.css"
```

Configuration files (`.htmlvalidate.json` and `.stylelintrc.json`) live at the repo root so local runs and CI use the same rules. Both default rule sets are reasonable starting points; the team can relax rules as patterns emerge rather than guessing up front.

### Consequences

* Good: markup and stylesheet errors are caught before merge, not at runtime in the Render Pane
* Good: matches the no-install, `npx --yes` pattern from ADR-007, so the workflow remains zero-dependency
* Good: parallelizes cleanly as a third job, so total gate runtime stays at `max(lint, unit, validate)`
* Good: contributors can run the same `npx` commands locally before pushing
* Neutral: `npx --yes` re-downloads each tool per CI run, adding a few seconds; acceptable while the gate remains fast overall
* Bad: validators only check static files; they will not catch HTML or CSS that the game generates dynamically at runtime (that remains an E2E concern)
* Bad: rule tuning will likely be needed in the first few PRs as the team agrees on what counts as an error vs. a warning

## Pros and Cons of the Options

### `html-validate` plus `stylelint` via `npx` (chosen)

* Good, because both ship as standalone CLIs runnable with `npx --yes`, matching the existing pattern
* Good, because both have well-documented rule configuration and disable comments for one-off exceptions
* Good, because `stylelint` is the de-facto CSS linter and integrates with most editors for live feedback
* Bad, because two tools mean two configuration files to maintain
* Bad, because `npx --yes` adds a small per-run download cost

### W3C Nu Html Checker (`vnu`)

* Good, because it is the official W3C validator and the most authoritative on spec conformance
* Good, because a single tool covers HTML (and via the Jigsaw companion, CSS)
* Bad, because it requires a Java runtime in CI, breaking the Node-only toolchain
* Bad, because it is harder to silence false positives on intentional patterns; rule overrides are coarser than `html-validate`'s
* Bad, because it is slower to start, eroding the "fast gate" goal of ADR-007

### `html-validate` only, defer CSS validation

* Good, because smallest footprint and only one config file
* Good, because HTML errors are arguably the higher-impact class (a broken tag breaks the page; a bad CSS rule usually just doesn't apply)
* Bad, because CSS typos are exactly the kind of silent failure CI should catch, and the project is a CSS-heavy typing game
* Bad, because adding `stylelint` later is the same amount of work as adding both now
