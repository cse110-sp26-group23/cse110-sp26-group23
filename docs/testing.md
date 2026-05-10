# Testing Strategy

## Philosophy

Tests must be written alongside features as they are built — not added at the end of the project. The course rubric requires early, verifiable testing effort visible in commit history. A new feature PR should include tests for the logic it introduces.

Test behavior, not implementation. Each test should express what a component is supposed to do, not how it does it internally.

---

## Unit Testing

### Approach

Since the project uses no npm dependencies, unit tests run as standalone HTML files that load a test library via CDN. No Node.js or build tools are needed — open the test runner in a browser to run tests.

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
| `inputPane.js` | Character diff logic (correct vs. error detection) |

DOM-dependent behavior (rendering, event wiring) is covered by E2E tests.

### Running Unit Tests Locally

Open `source/tests/index.html` in any browser. No server required for unit tests.

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
npm install -g playwright

# Run
playwright test
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

Unit tests run automatically on every PR via `.github/workflows/test.yml`. The workflow will be updated to run Playwright E2E tests once the dependency is approved.

Manually review the Actions tab after pushing to confirm tests are passing before requesting review.
