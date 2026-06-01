# MT-002: Settings persist across reload

- **Area:** settings
- **Priority:** smoke
- **Automated counterpart:** settings round-trip is unit-tested (`settings.test.js`, localStorage round-trips) and the panel controls have E2E coverage ([ADR-015](../decisions/015-playwright-e2e.md)). This script exists to confirm that the *visible* effect of each control applies immediately and survives a real browser reload, which is what a player actually experiences.

## Preconditions
- `localStorage` cleared (see [README conventions](README.md#conventions)).
- App served at `http://localhost:8000/`.

## Steps and Expected Results

| # | Step (what the tester does) | Expected result (what they should see/hear) |
|---|------------------------------|----------------------------------------------|
| 1 | On the landing screen, click **Settings**. | A settings panel opens showing code-snippet controls for Volume, Audio, Timer, Theme, and View, plus Restart Level and Exit. |
| 2 | Click the **Theme** value repeatedly. | The value cycles through `default → yellow → purple → orange` and the page colours change immediately on each click. Leave it on a non-default theme (e.g. `purple`). |
| 3 | Click into the **Volume** value, clear it, and type `20`. | The volume reads `20`; if audio is playing it gets noticeably quieter. |
| 4 | Click the **Audio** value to set it to disabled. | The control reads disabled and any sound stops. |
| 5 | Click the **View** value to switch it (e.g. to `mobile`), then back to `desktop`. | The layout visibly switches with the value. Leave it on `desktop`. |
| 6 | Close the panel and reload the page (browser refresh). | After reload the chosen theme is still applied (purple), and reopening Settings shows Volume `20` and Audio disabled. |
| 7 | Open DevTools → Application → Local Storage. | A `cse110-typing-game/settings` key exists holding the values set above. |

## Pass criteria
- Every changed setting applies visibly when changed and is still in effect (and present in `localStorage`) after a full page reload.

## Notes for the tester
- The light/dark colour scheme defaults to dark ([docs/design.md](../design.md)); this script tests the colour **theme** control, not light/dark.
- If a setting resets on reload, capture the `cse110-typing-game/settings` value before and after and attach it to the [test-log](../test-log.md) entry.
