# Design Document

## Design Goals

Before deciding on any features, the team aligned on three primary goals that drive all design decisions:

1. **Learning through repetition** — the game should build genuine muscle memory for HTML and CSS syntax, not just test speed with arbitrary text
2. **Immediate visual feedback** — seeing your code render live makes the connection between syntax and result tangible and satisfying
3. **Building as the core mechanic** — completing a prompt means you have constructed a working mini webpage. The experience should feel like drawing or assembling something, not like a test. The rendered output is the reward, not just the score.

Features are evaluated against these goals. A feature that does not serve one of them is low priority regardless of how fun it sounds.

---

## User Personas

### Persona 1: The CS Student (primary)
- **Profile:** Undergraduate CS student, knows basic HTML/CSS conceptually, wants to improve syntax recall and typing speed
- **Goal:** Practice writing HTML tags and CSS properties faster, with immediate feedback on whether the output looks right
- **Pain point:** Existing typing games use prose text — there is no game that specifically reinforces code syntax
- **Scenario:** Has 10 minutes between classes, wants a quick practice session before an assignment

### Persona 2: The Hobbyist Developer
- **Profile:** Self-taught, learning HTML/CSS from tutorials, wants a more engaging way to practice than copy-pasting examples
- **Goal:** Build muscle memory for common patterns (flexbox, selectors, semantic HTML) through repetition
- **Pain point:** Passive learning (reading, watching videos) does not translate to fast, confident typing
- **Scenario:** Practicing in the evening after work, wants to track improvement over multiple sessions

### Persona 3: The TA / Grader (developer persona)
- **Profile:** Needs to clone, run, and evaluate the project quickly without a complex setup
- **Goal:** Open the app in a browser within 60 seconds of cloning the repo, understand the codebase structure, and verify features work
- **Pain point:** Undocumented or complex build processes waste grading time
- **Scenario:** Evaluating the project for the first time with no prior context

---

## User-Centered Design Flow

```
Landing Screen
  │
  ├── Select difficulty (Easy / Medium / Hard)
  │
  v
Game Screen
  ├── [Left pane]  — prompt display + input area
  ├── [Right pane] — live rendered result (iframe)
  ├── [Top bar]    — timer, WPM counter, error count
  │
  ├── User types → input compared character-by-character against prompt
  ├── Correct characters: advance cursor, update render pane
  ├── Incorrect characters: highlight error, increment error count
  │
  v
End Screen
  ├── Full rendered result displayed
  ├── Metrics summary: WPM, accuracy %, error count, time
  └── Options: Play Again (same prompt), New Prompt, Change Difficulty
```

Wireframes will be linked here once created. Wireframes must be completed before non-exploratory implementation begins (course requirement).

---

## Visual Design Principles

### Layout
- **Split-pane (desktop):** input on the left, render on the right, roughly 50/50
- **Metrics bar** at the top of the game screen, always visible
- Clean separation between the code area (monospace, dark) and the rendered output (normal browser defaults)

### Mobile Layout
Mobile is a first-class layout target, not a stretch goal.

- **Portrait:** render pane on top, input pane on bottom — the user sees what they are building above their keyboard
- **Landscape:** side-by-side, same as desktop but condensed
- Prompts on mobile are scoped to short snippets (individual tags, single properties) to suit on-screen keyboard input

_Exact breakpoints and layout switching: TBD during UI implementation._

*Driven by: "type small amounts of code on mobile"; "vertical or landscape modes"*

### Typography
- Code input and prompt display: monospace font (Fira Code or similar) for accurate character spacing
- UI text (labels, metrics, buttons): system sans-serif for readability

### Color and Theming
- **Default:** dark theme (reduces eye strain for extended sessions)
- **Toggle:** light theme available

*Driven by: "light and dark theme"*

- **Team brand colors** (yellow, purple, orange) used for interactive elements, highlights, and correct/error state indicators

### Correct / Error States
- Correct characters: subtle highlight (green tint or underline)
- Incorrect characters: clear error highlight (red tint), do not auto-advance the cursor
- Current cursor position: blinking caret or underline

### Accessibility Targets
- WCAG AA minimum contrast ratio for all text
- Keyboard navigable (no mouse required to play)
- Font size adjustable via browser zoom or in-game setting
- Respect `prefers-color-scheme` media query for default theme selection

*Driven by: "adjust font size and contrast settings"*

---

## Countdown Mode

A separate timed mode where the game ends when a countdown expires rather than when the prompt is completed.

_Exact design (timer duration, scoring, how it differs from free-play) TBD._

*Driven by: "separate countdown mode so that the game feels challenging and competitive"*

---

## Audio and Animations

Both are low-priority and deferred until core gameplay is stable. When implemented:

- **Sound effects** should reinforce correct/error states and prompt completion
- **Animations** (e.g., characters appearing as the render pane builds) should make the building mechanic feel more satisfying

*Driven by: "background music and sound effects"; "animations when making the website"*

---

## Feature Priority Alignment

_TBD — feature tiers (core vs. low priority) will be mapped here against user stories once sprint planning is underway. See the [user stories](../specs/user-stories/user-stories.md) for the current full list._
