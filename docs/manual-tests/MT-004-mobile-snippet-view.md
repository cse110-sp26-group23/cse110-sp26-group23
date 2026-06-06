# MT-004: Mobile snippet view

- **Area:** mobile
- **Priority:** full
- **Automated counterpart:** the mobile snippet flow (typing only the `{{...}}` tokens, scaffold auto-fills) is listed for E2E coverage ([ADR-015](../decisions/015-playwright-e2e.md)). This script exists to judge the parts a real device shows that a headless run does not: that the snippet layout reads clearly at a small width and that token-only typing feels right under touch.

## Preconditions
- `localStorage` cleared (see [README conventions](README.md#conventions)).
- App served at `http://localhost:8000/`. Run on a real phone on the same network, or in DevTools device-emulation at a phone width.

## Steps and Expected Results

| # | Step (what the tester does) | Expected result (what they should see/hear) |
|---|------------------------------|----------------------------------------------|
| 1 | Open Settings and set **View** to `mobile`. | The layout switches to the mobile presentation. |
| 2 | Pick a difficulty and level and start it. | The code pane shows the prompt as a scaffold with one or more `{{...}}` token blanks; the surrounding scaffold is pre-filled and not editable. |
| 3 | Type the content for the first token. | Only the token blank accepts input; the surrounding scaffold stays fixed, and the render pane updates as the token fills in. |
| 4 | Finish all tokens in the snippet. | The level completes and advances (next level or end screen) the same way the desktop flow does. |
| 5 | Read the whole snippet at the small width. | Text is legible, nothing is clipped or overflowing, and it is obvious which blanks the player is meant to type. |

## Pass criteria
- In mobile view the player types only the `{{...}}` tokens, the scaffold auto-fills around them, the render pane tracks the input, the level completes, and the layout is legible at phone width.

## Notes for the tester
- Test on at least one real touch device per release if possible; emulation catches layout but not touch-keyboard quirks.
- If a non-token part of the scaffold accepts typing, that is a fail; capture the level id and the snippet in the [test-log](../test-log.md) notes.
