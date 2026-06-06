# Scripted Manual Testing Format and Plan

## Status

Accepted

## Context and Problem Statement

Automated testing covers two layers: Jasmine unit specs for pure logic ([ADR-009](009-jsdom-dev-dependency.md)) and Playwright E2E for cross-component, real-browser flows ([ADR-015](015-playwright-e2e.md)). Both [ADR-015](015-playwright-e2e.md) and [docs/testing.md](../testing.md#manual-testing) state plainly that this is a game and not everything can be automated: the *feel* of the live render, audio behaviour ([ADR-016](016-generative-music.md)), animation smoothness, mobile snippet ergonomics, and cross-browser/-device look-and-feel still need a human in the loop, and ADR-015 ends by calling for "human test scripts that specify how people should test the page."

Today that human testing has no defined shape. `docs/testing.md` specifies a results *log* format (date, tester, browser, result), but there is no format for the **scripts** a tester follows, no list of which flows must be checked, and no rule for *when* a manual pass happens. The result is that manual testing is ad hoc: different people exercise different things, coverage is invisible, and a regression in something unautomatable (audio not starting on theme change, layout breaking on mobile Safari) is caught only by luck. We need a decision on the format of manual test scripts and the plan for running them.

This ADR is scoped to *how manual tests are written and scheduled*, not to whether manual testing exists at all (already settled) nor to the automated layers (settled in [ADR-009](009-jsdom-dev-dependency.md) and [ADR-015](015-playwright-e2e.md)).

## Decision Drivers

* **Repeatability.** Two different testers running the same script on the same build should exercise the same steps and judge the same expected results, so a "pass" means the same thing every time.
* **Visible coverage.** It should be obvious which user-facing flows are covered by a manual pass and which are not, the same way the E2E "What to E2E Test" list makes automated coverage legible.
* **Low ceremony.** The team is a student group with no QA role; the format must be plain Markdown in the repo, fast to author and to run, with no tooling, account, or build step ([ADR-001](001-tech-stack.md)).
* **Targets the automation gap.** Scripts should concentrate on what unit and E2E cannot honestly check: audio, animation, real-device rendering, cross-browser appearance, and subjective feel, not re-cover logic Jasmine already owns.
* **Traceable results.** A run must produce a durable record (who, when, which build, what broke) that lives next to the code, reusing the existing test-log format rather than inventing a parallel one.
* **Clear cadence.** It must be unambiguous when a manual pass is required (which PRs, before which releases) so coverage does not silently decay between milestones.

## Considered Options

* **Ad-hoc manual testing (status quo).** Keep only the results log; let each tester decide what to click.
* **Scripted manual test cases with a defined Markdown format and a triggered plan** (chosen).
* **Exploratory / session-based testing only.** Time-boxed charters ("explore the settings panel for 15 min") with no step-by-step scripts.
* **Rely solely on automated E2E.** Push everything into Playwright and drop manual testing.

## Decision Outcome

Chosen option: **scripted manual test cases with a defined Markdown format and a triggered plan**, because it is the only option that gives repeatable, visible coverage of the exact things automation cannot reach, while staying plain Markdown in the repo with no new tooling.

### Where things live

```
docs/
  manual-tests/
    README.md          # the suite index + which scripts are in the smoke set
    MT-001-core-playthrough.md
    MT-002-settings-persistence.md
    MT-003-audio-and-music.md
    ...
  test-log.md          # run records (existing format from docs/testing.md)
```

Each script is one file, `MT-NNN-short-title.md`, numbered sequentially. The suite index in `docs/manual-tests/README.md` lists every script and tags which belong to the **smoke set** (the short must-pass-before-merge subset) versus the **full set** (run before a release).

### Script format

Every manual test script follows this template:

```markdown
# MT-NNN: <short title>

- **Area:** <gameplay | settings | audio | rendering | mobile | accessibility | theming>
- **Priority:** <smoke | full>
- **Automated counterpart:** <link to e2e/ spec, or "none — manual only because ...">

## Preconditions
- <fresh state, cleared localStorage, which URL, which build, etc.>

## Steps and Expected Results

| # | Step (what the tester does) | Expected result (what they should see/hear) |
|---|------------------------------|----------------------------------------------|
| 1 | ...                          | ...                                          |
| 2 | ...                          | ...                                          |

## Pass criteria
- <the single sentence that decides pass vs fail for the whole script>

## Notes for the tester
- <known quirks, what NOT to flag, edge cases worth poking>
```

Rules that make a script repeatable:

* **One observable expectation per step.** A step that asserts nothing is setup, fold it into the next step. Expected results describe what a human can see or hear, never internal state.
* **Preconditions are explicit.** Scripts assume a stated starting point (usually cleared `localStorage` and a named build/URL) so runs are comparable.
* **Every script names its automated counterpart.** If a flow *could* be a Playwright spec, the script links it and exists only to cover the residual human-judgement part; if it is manual-only, it says why (audio, animation feel, real-device rendering). This keeps scripts from duplicating [ADR-015](015-playwright-e2e.md) coverage.

### Run plan and cadence

* **Smoke set on risky PRs.** A PR that touches user-facing behaviour in a way unit/E2E cannot fully cover (audio, animation, layout, mobile, theming) runs the smoke set before merge. The author records the run in `docs/test-log.md` and links it from the PR.
* **Full set before a release / demo.** Before any deploy to GitHub Pages ([ADR-003](003-deployment-target.md)) or graded demo, one team member runs the full set across the supported browser matrix and logs the results.
* **Results go in the existing log.** Each run appends an entry to `docs/test-log.md` using the table format already defined in [docs/testing.md](../testing.md#manual-testing) (date, tester, feature/script ID, browser, OS, steps, result, notes). The script defines *what* to do; the log records *that it was done* and the outcome.
* **A failed step files an issue.** A `Fail` or `Partial` result links a GitHub issue from the log entry so the regression is tracked, not just noted.

`docs/testing.md`'s Manual Testing section is updated to point at `docs/manual-tests/` for the scripts and to keep owning the log format, so the two stay in sync.

### Consequences

* Good: manual coverage becomes legible, anyone can read `docs/manual-tests/README.md` and see exactly which flows a human checks and which are in the merge-blocking smoke set.
* Good: runs are repeatable and comparable across testers and builds, so "passed manual testing" carries real information.
* Good: scripts deliberately target the automation gap ([ADR-015](015-playwright-e2e.md), [ADR-016](016-generative-music.md)) instead of duplicating Jasmine/Playwright, and each script's "automated counterpart" field makes that boundary explicit.
* Good: zero new tooling, plain Markdown next to the code, consistent with the no-build stance ([ADR-001](001-tech-stack.md)).
* Neutral: the existing test-log format is reused unchanged; only a scripts directory and an index are added.
* Bad: scripts are hand-maintained and can drift from the UI; a stale script is worse than none, so the smoke set is kept deliberately small and reviewed when the flow it covers changes.
* Bad: manual passes still cost human time on every risky PR and before every release; the smoke/full split bounds that cost but does not remove it.

## Pros and Cons of the Options

### Ad-hoc manual testing (status quo)

* Good, because it has zero authoring cost and the results-log format already exists.
* Bad, because coverage is invisible and non-repeatable: nobody can tell what was actually exercised, so regressions in unautomatable behaviour are caught only by chance.
* Bad, because it leaves the "human test scripts" gap [ADR-015](015-playwright-e2e.md) explicitly called out still open.

### Scripted manual test cases with a defined format and plan (chosen)

* Good, because a fixed template plus a smoke/full split gives repeatable, legible, merge-gated coverage of exactly what automation cannot reach.
* Good, because it reuses the existing `docs/test-log.md` format for results, so only the scripts and an index are new.
* Bad, because scripts must be maintained as the UI changes and can go stale if neglected.

### Exploratory / session-based testing only

* Good, because charters are cheap to write and good at surfacing surprises a fixed script would walk past.
* Good, because it suits subjective, feel-based areas like animation and audio.
* Bad, because results are not repeatable or comparable across testers, so it cannot serve as a merge gate or a coverage record on its own.
* Bad, because without named expected results, "it felt fine" is not a durable pass criterion. (Exploratory sessions remain welcome as an *addition*, logged like any other run, but not as the only manual layer.)

### Rely solely on automated E2E

* Good, because automated checks run on every PR with no human time per run.
* Bad, because Playwright cannot honestly assert audio output, animation smoothness, real-device rendering, or subjective feel, the precise things [ADR-015](015-playwright-e2e.md) and [ADR-016](016-generative-music.md) say need a human.
* Bad, because pushing inherently-manual concerns into E2E produces brittle, low-value specs and still leaves the feel-based gaps uncovered.
