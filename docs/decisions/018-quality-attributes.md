# Prioritized Quality Attributes (the "-ilities")

## Status

Accepted

## Context and Problem Statement

Codekata is a static, no-build, vanilla HTML/CSS/JS typing game shipped to GitHub Pages ([ADR-001](001-tech-stack.md), [ADR-003](003-deployment-target.md)). Many of our existing decisions implicitly optimize for some quality attribute, a non-functional "-ility", without ever naming which attributes the project values most: [ADR-013](013-feature-modules.md) optimizes maintainability, [ADR-015](015-playwright-e2e.md) and [ADR-009](009-jsdom-dev-dependency.md) optimize testability, [ADR-010](010-hardcoded-values.md) optimizes consistency. When two attributes conflict (for example richer generative audio in [ADR-016](016-generative-music.md) costs simplicity and a little performance), we have no shared, written priority order to break the tie.

We need to agree on a small, ranked set of quality attributes that this project treats as first-class, so future ADRs and code reviews can point at a shared list instead of re-litigating priorities each time. This ADR collects a large candidate list and records the team's selected **top 5**.

This ADR does not invent new processes; it ranks the values the codebase already pulls toward so trade-offs become explicit.

## Decision Drivers

* **A short, ranked list beats a long flat one.** Five named priorities can actually guide a decision; twenty cannot. Everything is "nice to have," so the value is in choosing what wins under conflict.
* **Fit the project as it actually is.** A student-built, browser-only game on GitHub Pages, played by a graded audience and arbitrary visitors, with no backend, no accounts, and no user data. Attributes that matter for servers (availability SLAs, horizontal scalability) carry little weight here.
* **Reinforce existing decisions.** The chosen attributes should explain, not contradict, the stances already taken in prior ADRs.
* **Be measurable or reviewable.** A priority we cannot check in a PR or a manual pass ([ADR-017](017-manual-testing.md)) cannot actually steer behaviour.

## Considered Options

The full candidate list below is grouped for readability. The team selects the **top 5**; the rest remain documented as secondary concerns, not rejected ones.

### User-facing quality

* **Usability** — the game is intuitive to start and play without instruction.
* **Accessibility** — keyboard navigation, ARIA roles, contrast; reaches players using assistive tech (already partly driven in [ADR-015](015-playwright-e2e.md)'s accessibility smoke tests).
* **Learnability** — a first-time player understands the typing loop quickly (a sub-facet of usability).
* **Responsiveness** — the live render and per-keystroke feedback feel instant ([ADR-002](002-live-render-strategy.md)).
* **Aesthetics / polish** — theming, animation, and audio feel cohesive ([ADR-010](010-hardcoded-values.md), [ADR-016](016-generative-music.md)).

### Runtime quality

* **Performance / efficiency** — low CPU and memory; per-keystroke rendering and the audio engine stay smooth on modest hardware ([ADR-016](016-generative-music.md)).
* **Reliability** — the game behaves correctly across a full play-through without crashing or corrupting saved settings.
* **Robustness / fault tolerance** — graceful degradation when Web Audio, `localStorage`, or a feature is unavailable.
* **Portability / cross-browser compatibility** — identical behaviour across Chromium, Firefox, and WebKit, the reason [ADR-015](015-playwright-e2e.md) chose Playwright.
* **Security** — user-typed HTML/CSS is rendered in a sandboxed iframe; no injection escapes into the app shell.
* **Availability** — the static site is reachable (largely handed to GitHub Pages, so low project effort).

### Developer-facing quality

* **Maintainability** — code is easy to change safely; the central goal of the per-feature module split ([ADR-013](013-feature-modules.md)).
* **Testability** — logic is structured so it can be verified cheaply ([ADR-009](009-jsdom-dev-dependency.md), [ADR-015](015-playwright-e2e.md), [ADR-017](017-manual-testing.md)).
* **Readability** — code reads clearly; enforced via JSDoc, linting, and naming conventions (AGENTS.md, [ADR-006](006-jsdoc-template.md)).
* **Modularity** — one ES module per feature with clean seams ([ADR-013](013-feature-modules.md)).
* **Simplicity** — the no-build, no-dependency stance; the smallest thing that works ([ADR-001](001-tech-stack.md)).
* **Reusability** — pure helpers (metrics, music theory) usable across modules.
* **Extensibility** — new prompts, themes, and game modes drop in without reworking the core ([ADR-004](004-json-prompt-schema.md)).
* **Consistency** — uniform tokens, conventions, and structure ([ADR-010](010-hardcoded-values.md), [ADR-011](011-css-organization.md)).
* **Documentability** — decisions and conventions are captured (the whole ADR practice, [ADR-014](014-agents-md.md)).
* **Deployability** — shipping is a no-build artifact push ([ADR-003](003-deployment-target.md), [ADR-012](012-kuberenetes-cicd.md)).
* **Observability** — ability to see what the running game is doing (low relevance for a static client game).
* **Configurability** — player-facing settings (theme, audio, difficulty) persist and restore.
* **Scalability** — handling growth in content/users (low relevance: static assets, no backend).
* **Internationalization / localizability** — adapting language and locale (currently out of scope).
* **Compliance** — meeting an external standard such as WCAG (a formalization of accessibility).

## Decision Outcome

Chosen top 5, in priority order:

1. **Usability** — a visitor can land on the page and start playing the typing loop without instructions, and the settings, difficulty, and end screen read as obvious. This is the project's primary value because the audience is graders and arbitrary GitHub Pages visitors who get one chance to "get it." *Checked by:* the full play-through E2E flow ([ADR-015](015-playwright-e2e.md)) and the smoke/full manual scripts ([ADR-017](017-manual-testing.md)).
2. **Maintainability** — a contributor can change one feature without untangling the rest, across a multi-person student team on a short timeline. *Checked by:* one ES module per feature ([ADR-013](013-feature-modules.md)), the lint/validation PR gates ([ADR-007](007-workflow.md), [ADR-008](008-html-css-validation.md)), and the unit suite ([ADR-009](009-jsdom-dev-dependency.md)) that lets changes be made safely.
3. **Learnability** — a first-time player understands the type-and-watch-it-render loop within seconds, matching the personas and UCD flow in [docs/design.md](../design.md). Distinct from usability: usability is "can an experienced user operate it," learnability is "how fast does a newcomer get there." *Checked by:* manual scripts run from a cleared-state precondition ([ADR-017](017-manual-testing.md)), judging first-run comprehension.
4. **Aesthetics** — theming, animation, and the generative audio read as one cohesive, polished whole rather than assembled parts. *Checked by:* the theming/audio/animation manual scripts ([ADR-017](017-manual-testing.md)) and theme-token consistency ([ADR-010](010-hardcoded-values.md), [ADR-016](016-generative-music.md)).
5. **Readability** — source reads clearly enough that a teammate or grader can follow it without the author present. *Checked by:* the JSDoc requirement ([ADR-006](006-jsdoc-template.md)), ESLint, and the naming/structure conventions in AGENTS.md.

When two of these conflict, the higher-ranked attribute wins, and the deciding ADR cites this order. The clearest expected tension is **usability/aesthetics vs maintainability/readability**: a richer interaction or visual flourish that complicates the code is accepted only up to the point it threatens the team's ability to keep changing the project safely.

The remaining attributes from the candidate list are not discarded; they stay documented above as secondary concerns the team still honours when they are cheap, but does not let override a top-5 attribute under conflict. Two deserve a note because they sit just outside the cut: **accessibility** is still pursued (it has its own E2E smoke coverage in [ADR-015](015-playwright-e2e.md)) and is partly subsumed by usability, and **simplicity** is effectively guaranteed by the no-build stance in [ADR-001](001-tech-stack.md) and so did not need its own slot.

### Consequences

* Good: future ADRs and reviews resolve trade-offs against a shared, ranked list instead of ad-hoc argument.
* Good: the ranking makes implicit priorities in existing ADRs explicit and checkable.
* Neutral: the list is a guide, not a gate; it informs decisions rather than blocking PRs by itself.
* Bad: any ranking under-weights real concerns that fall outside the top 5; those must be revisited if the project's shape changes (e.g. if a backend or accounts are ever added).

## Pros and Cons of the Options

A full pro/con for all 25 candidates is impractical; what matters is why each of the chosen five beat its closest runner-up. The whole list is biased toward *user-facing* and *developer-facing* quality because the runtime tier (availability, scalability, observability) is largely handed to GitHub Pages or irrelevant to a static client game.

### Usability (chosen) vs Responsiveness / Accessibility

* Good, because for a one-shot graded/visitor audience, "can they figure out how to play" is the single highest-leverage attribute, and it partly subsumes its runners-up.
* Bad, because it is the hardest of the five to measure objectively, leaning on manual judgement rather than a hard gate.
* Chosen over **responsiveness** because the live-render path is already fast by design ([ADR-002](002-live-render-strategy.md)), so responsiveness is mostly *already handled*, and over **accessibility** because accessibility is narrower, already has E2E smoke coverage ([ADR-015](015-playwright-e2e.md)), and overall ease-of-use was judged the broader priority.

### Maintainability (chosen) vs Testability / Modularity / Simplicity

* Good, because on a multi-person student team with a short timeline, the ability to change code safely is what keeps the project shippable to the end.
* Bad, because it is an umbrella attribute, so "is this maintainable" can be vaguer than its more specific runners-up.
* Chosen over **modularity**, **testability**, and **simplicity** because those are largely *means to* maintainability that are already locked in by existing ADRs ([ADR-013](013-feature-modules.md), [ADR-009](009-jsdom-dev-dependency.md), [ADR-001](001-tech-stack.md)); naming the goal rather than the mechanisms keeps the list short.

### Learnability (chosen) vs Usability / Documentability

* Good, because a typing game lives or dies on whether a newcomer "gets it" immediately, and that first-run experience is distinct enough from general usability to track on its own.
* Bad, because it overlaps heavily with usability, so the line between the two must be drawn carefully (newcomer comprehension vs operability for someone who already understands the game).
* Chosen over **documentability** because end-user learnability comes from the in-product experience, not external docs, for a game with no manual.

### Aesthetics (chosen) vs Performance / Simplicity

* Good, because cohesive theming, animation, and generative audio ([ADR-016](016-generative-music.md)) are a core part of what makes the game feel finished rather than a class exercise.
* Bad, because polish is the attribute most in tension with the other four, richer visuals and audio cost code complexity and a little performance, which is exactly why it ranks fourth, not first.
* Chosen over **performance** because the app is light enough that efficiency is rarely the binding constraint, and over **simplicity** because simplicity is already guaranteed structurally by the no-build stance ([ADR-001](001-tech-stack.md)).

### Readability (chosen) vs Documentability / Consistency

* Good, because clear source is what lets teammates and graders follow the code directly, and it is cheaply enforceable through gates already in place ([ADR-006](006-jsdoc-template.md), AGENTS.md, ESLint).
* Bad, because it partly overlaps maintainability, so it earns its own slot only as the human-facing, in-the-file half of that goal.
* Chosen over **documentability** (captured separately by the ADR practice itself, [ADR-014](014-agents-md.md)) and **consistency** (already enforced via tokens and structure, [ADR-010](010-hardcoded-values.md), [ADR-011](011-css-organization.md)) because those concerns are already covered, whereas day-to-day code clarity benefits from being named an explicit priority.
