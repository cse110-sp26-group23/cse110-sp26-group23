# Manual Test Scripts

Scripted manual test cases for the flows that automation cannot honestly cover (subjective feel, audio, animation, real-device rendering). Format and run plan are defined in [ADR-017](../decisions/017-manual-testing.md); priorities reference the quality attributes in [ADR-018](../decisions/018-quality-attributes.md).

Each script is one file, `MT-NNN-short-title.md`, following the template in [ADR-017](../decisions/017-manual-testing.md#script-format). Results of a run are recorded separately in [`docs/test-log.md`](../test-log.md) using the table format in [docs/testing.md](../testing.md#manual-testing); a `Fail` or `Partial` links a GitHub issue.

## Suite

| ID | Title | Area | Priority |
|----|-------|------|----------|
| [MT-001](MT-001-core-playthrough.md) | Core play-through | gameplay | **smoke** |
| [MT-002](MT-002-settings-persistence.md) | Settings persist across reload | settings | **smoke** |
| [MT-003](MT-003-audio-and-music.md) | Audio and generative music | audio | full |
| [MT-004](MT-004-mobile-snippet-view.md) | Mobile snippet view | mobile | full |

## Sets

- **Smoke set** (run before merging a PR that touches user-facing behaviour automation cannot fully cover): MT-001, MT-002.
- **Full set** (run before any deploy or graded demo, across the supported browser matrix): all scripts above.

## Supported browser matrix

Run the full set across the browsers Playwright is configured for ([ADR-015](../decisions/015-playwright-e2e.md)): Chromium, Firefox, and WebKit. Note browser + OS in each [test-log](../test-log.md) entry.

## Conventions

- **Preconditions assume a clean start.** Unless a script says otherwise, clear `localStorage` first (DevTools → Application → Local Storage → delete the `cse110-typing-game/settings` key, or run `localStorage.clear()` in the console) and serve the app with `python3 -m http.server --directory source 8000`, then open `http://localhost:8000/`.
- **One observable expectation per step.** Expected results describe what a human can see or hear, never internal state.
- **Every script names its automated counterpart** so scripts stay focused on the residual human-judgement part instead of duplicating Jasmine or Playwright coverage.
