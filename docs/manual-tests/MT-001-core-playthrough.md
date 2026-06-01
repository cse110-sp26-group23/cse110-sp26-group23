# MT-001: Core play-through

- **Area:** gameplay
- **Priority:** smoke
- **Automated counterpart:** `e2e/` full-flow spec ([ADR-015](../decisions/015-playwright-e2e.md)). This script exists for the parts a human still judges: that the live render *looks* right as it updates, that the flow *feels* coherent end to end, and that error highlighting reads clearly. It is not a replacement for the E2E flow.

## Preconditions
- `localStorage` cleared (see [README conventions](README.md#conventions)).
- App served at `http://localhost:8000/` from the latest build of the branch under test.

## Steps and Expected Results

| # | Step (what the tester does) | Expected result (what they should see/hear) |
|---|------------------------------|----------------------------------------------|
| 1 | Open `http://localhost:8000/`. | Landing screen shows the "Codekata" title, a Settings button, a "Select Difficulty" section (Beginner / Intermediate / Expert), and a "Select Level" section. |
| 2 | Click **Beginner**. | The Beginner button reads as selected, and the Level section fills with one button per beginner level. |
| 3 | Click the first level button. | That level button reads as selected; the others do not. |
| 4 | Click **Start**. | The game page (`game.html`) opens with the prompt text shown in the code pane and the render pane in its initial (empty/placeholder) state. |
| 5 | Type the prompt exactly, watching the render pane. | Each correct character is marked correct as typed, and the render pane updates live to reflect the HTML/CSS typed so far. |
| 6 | While typing, deliberately type one wrong character, then correct it. | The wrong character is clearly highlighted as an error, and fixing it clears the highlight. |
| 7 | Keep typing; watch the progress bar and timer. | The progress bar fills toward 100% as you advance and the timer counts up (or down, if the countdown timer is enabled). |
| 8 | Finish the prompt. | The end screen appears showing final metrics (WPM, accuracy, time) that are plausible for how you typed. |

## Pass criteria
- The full land → pick difficulty → pick level → type → end-screen flow completes, the render pane tracks the typing live, errors are visibly highlighted, and the end-screen metrics are plausible.

## Notes for the tester
- Do **not** flag exact WPM/accuracy values; this script checks that the flow works and the numbers are reasonable, not their precise correctness (that is unit-tested in `metrics.test.js`).
- If the render pane stays blank, confirm you opened the served URL and not the file directly (modules fail silently over `file://`).
