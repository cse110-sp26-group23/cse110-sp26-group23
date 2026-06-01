# MT-003: Audio and generative music

- **Area:** audio
- **Priority:** full
- **Automated counterpart:** none — manual only. The generative engine depends on `AudioContext`, which jsdom does not provide and Playwright cannot honestly assert on (output is sound, not DOM). The pure musical logic is unit-tested (`music-theory` / `music-themes`), but whether it actually *plays*, *responds*, and *sounds* right is human-judged. See [ADR-016](../decisions/016-generative-music.md).

## Preconditions
- `localStorage` cleared (see [README conventions](README.md#conventions)); audio therefore starts enabled at volume 50.
- Headphones or speakers on; quiet room.

## Steps and Expected Results

| # | Step (what the tester does) | Expected result (what they should see/hear) |
|---|------------------------------|----------------------------------------------|
| 1 | Open the app and start any level (this first click is the user gesture Web Audio needs). | Ambient, lo-fi generative music begins within a second or two; it does not sound like a tight short loop. |
| 2 | Let it play for ~60 seconds without typing. | The arrangement evolves over time (layers swell and recede); it does not audibly repeat a short cycle. |
| 3 | Open Settings and change the **Theme** (e.g. `default → orange`). | The music crossfades to a different character/vibe for the new theme rather than cutting abruptly. |
| 4 | Lower the **Volume** to about `15`. | All audio gets quieter in proportion; nothing clips or distorts. |
| 5 | Set **Audio** to disabled. | All sound stops promptly with no stuck or hanging notes. |
| 6 | Set **Audio** back to enabled. | Music resumes cleanly. |

## Pass criteria
- Music plays, evolves rather than looping tightly, changes character with the theme, scales with volume, and stops/starts cleanly with the Audio toggle, with no clipping, stuck notes, or audible glitches.

## Notes for the tester
- Web Audio will not start without a user gesture; if step 1 is silent, click once anywhere and listen again before failing the script.
- Judgements here are subjective ("does it sound lo-fi and non-repetitive"). Describe what you heard in the [test-log](../test-log.md) notes rather than forcing a binary feel-rating.
- Run this on at least one browser per release; WebKit/Safari audio autoplay rules differ, so note the browser.
