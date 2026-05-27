# AGENTS.md as the Single Source of AI Agent Instructions

## Status

Accepted

## Context and Problem Statement

Team members use AI coding assistants (Claude Code and others) while working in this repo, and each tool looks for its own instructions file (`CLAUDE.md` for Claude Code, `AGENTS.md` for the broader convention). The project already maintains thorough human documentation - architecture, design, testing, contributing, and ADRs - and we do not want to duplicate any of it into an agent file that then drifts out of date. How should we give AI agents the project context they need without maintaining a second copy of the documentation, and without keeping a separate instructions file per tool?

## Decision Drivers

* Agents need enough context to follow our conventions (no build step, ES modules, named exports, branch/commit rules, JSDoc) without being told every time.
* The existing human documentation is the source of truth; agent instructions must not duplicate or fork it.
* Whatever we write must stay correct as the docs evolve, with no separate update step to remember.
* Multiple AI tools each expect a differently named instructions file; we do not want to maintain several.
* The convention should be cheap to extend as new docs are added.

## Considered Options

* No agent instructions file; let each agent infer conventions from the code
* A standalone agent file that copies the key rules from the documentation inline
* A single `AGENTS.md` holding preliminary info plus links to the existing docs, with `CLAUDE.md` pointing to it

## Decision Outcome

Chosen option: **a single `AGENTS.md` that holds a small amount of preliminary info and links to the existing documentation, with `CLAUDE.md` redirecting to it**, because it gives agents the context they need while keeping the real documentation as the single source of truth.

`AGENTS.md` lives at the repo root and contains:

* A brief orientation: what the project is, the vanilla-JS / no-build-step constraint, and where the code lives.
* The handful of rules most likely to trip up an agent (ES modules only, named exports only, branch from `dev`, Conventional Commits, JSDoc on exports).
* **Links** out to the canonical docs - [README](../../README.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), [architecture](../architecture.md), [design](../design.md), [testing](../testing.md), the [ADR index](README.md), and the [user stories](../../specs/user-stories/user-stories.md) - rather than restating their contents.

Because the substance lives behind links, edits to those documents are reflected automatically; `AGENTS.md` only needs changing when the set of documents or the orientation itself changes.

`CLAUDE.md` is a thin pointer that directs Claude Code to read `AGENTS.md`, so there is exactly one instructions file to maintain regardless of how many tools are in use. Additional tools that adopt their own filename convention follow the same pattern: a one-line redirect to `AGENTS.md`.

### Consequences

* Good, because the documentation stays the single source of truth and is not duplicated into the agent file.
* Good, because `AGENTS.md` rarely goes stale - it points at docs that are updated as part of normal work.
* Good, because there is one real instructions file; per-tool files are one-line redirects.
* Good, because new agent tools are onboarded by adding a single redirect file.
* Bad, because an agent must follow links to get full context rather than reading everything in one file, which costs extra reads.
* Bad, because the redirect indirection (`CLAUDE.md` -> `AGENTS.md`) is an extra hop a reader has to follow.
* Bad, because if a linked document is moved or renamed without updating `AGENTS.md`, the link breaks.

## Pros and Cons of the Options

### No agent instructions file

* Good, because there is nothing extra to write or maintain.
* Bad, because agents repeatedly violate conventions (build assumptions, default exports, wrong base branch) that are written down only for humans.
* Bad, because every contributor has to re-explain the same context to their assistant.

### A standalone agent file that copies the rules inline

* Good, because an agent gets everything in one place with no link-following.
* Bad, because it duplicates the documentation, so the two copies drift apart over time.
* Bad, because every doc change now needs a matching edit in the agent file, which is easy to forget.

### A single AGENTS.md with preliminary info plus links, and CLAUDE.md pointing to it

* Good, because the docs remain the source of truth and the agent file stays thin and stable.
* Good, because one file serves all tools through redirects, so there is no per-tool duplication.
* Good, because doc updates propagate without touching the agent file.
* Bad, because context is spread across linked files rather than inlined, and links must be kept valid.
