# Minimal PR Quality Check Workflow

## Status

Accepted

## Context and Problem Statement

Every PR needs an automated quality gate before review. The [Testing Strategy](../testing.md) lists unit tests, E2E tests, and manual testing as the full suite, but E2E (Playwright) is pending TA approval and manual testing is a human step that cannot block a PR. We need a minimal CI gate that runs on every PR without waiting on those other pieces.

![PR quality check workflow](workflow.svg)

## Decision Drivers

* Runs on every PR with no manual trigger
* No dependencies beyond what is already in the project (ESLint, Jasmine via CDN)
* Fast enough to not slow down review cycles
* Catches the two failure modes the rubric cares about: style drift and broken logic

## Considered Options

* **Lint only** ESLint as the sole gate
* **Lint plus unit tests in parallel** (chosen)
* **Lint plus unit tests plus E2E** full pipeline now

## Decision Outcome

Chosen option: **lint plus unit tests in parallel**, because it covers both style and logic without waiting on the Playwright approval. The two jobs are independent, so running them in parallel keeps the gate under a minute.

Workflow lives in `.github/workflows/test.yml` and triggers on `pull_request` to any branch.

### Consequences

* Good: every PR gets the same checks regardless of author or branch
* Good: parallel jobs mean total runtime is `max(lint, unit)`, not the sum
* Good: extends cleanly — adding Playwright later is one more parallel job, not a restructure
* Neutral: manual testing still happens but is logged in `docs/test-log.md` rather than gating the merge
* Bad: does not catch integration regressions until E2E is added

## Pros and Cons of the Options

### Lint only

* Good, because trivial to set up
* Bad, because lint passing tells you nothing about whether the code works

### Lint plus unit tests in parallel (chosen)

* Good, because covers style and logic with no extra dependencies
* Good, because parallel execution keeps the gate fast
* Bad, because no integration coverage until E2E lands

### Lint plus unit tests plus E2E

* Good, because full coverage from day one
* Bad, because blocks on Playwright approval that has not happened yet
* Bad, because E2E runtime would dominate the gate and slow review