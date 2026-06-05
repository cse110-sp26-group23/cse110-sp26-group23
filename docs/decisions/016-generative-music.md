# Generative Theme-Driven Background Music

## Status

Accepted

## Context and Problem Statement

Background music is synthesized live with the Web Audio API (the project ships no audio
files, see [ADR-001](001-tech-stack.md)). The original implementation played a single fixed
eight-note Fmaj9 arpeggio over a sine bass, identical for every color theme. It reads as a
short, obvious loop and gives no theme its own identity. We want simple algorithmic music
that feels lo-fi, gives each theme a distinct vibe, and morphs over time so it never sounds
like a tight loop, all without shipping audio assets.

## Decision Drivers

* Lo-fi, ambient feel that sits behind typing without distracting.
* Each theme (`default`, `yellow`, `purple`, `orange`) gets its own musical character.
* Long-form evolution: the arrangement should morph over minutes, not repeat a short cycle.
* No audio assets and no copyright exposure, consistent with the existing all-synthesis
  approach ([ADR-001](001-tech-stack.md)).
* Vanilla ES modules, no build step, with the musical logic unit-testable
  ([ADR-013](013-feature-modules.md)).
* Low CPU cost and graceful degradation where Web Audio is unavailable.

## Considered Options

* Ship per-theme recorded loops as audio files.
* Hand-compose one fixed arpeggio/loop per theme, synthesized as today.
* A data-driven generative engine: per-theme voicing data drives a Web-Audio scheduler that
  layers and morphs voices over time.

## Decision Outcome

Chosen option: "data-driven generative engine", because it is the only option that delivers
per-theme identity *and* non-repeating evolution while keeping the no-assets constraint.

The musical brain is split into pure, testable modules and one Web-Audio module:

* `music-theory.js` — pure helpers (MIDI/frequency conversion, scale and chord building,
  weighted random choice, common-tone blending).
* `music-themes.js` — pure data: one voicing per theme (key, scale, tempo, blendable chord
  progressions, pad/bass/filter/reverb settings, melody motif pool, ostinato, flourish, and
  per-voice probabilities).
* `music-engine.js` — a bar-based look-ahead scheduler that, each bar, advances a chord
  progression (picking the next progression so it shares a common tone for a smooth blend)
  and probabilistically layers pad, bass, melody, ostinato, and flourish voices. A slow
  deterministic "intensity" curve swells and recedes density over minutes. A single
  `ConvolverNode` with a synthesized decaying-noise impulse provides shared reverb. Changing
  theme crossfades between two voice buses.

`audio.js` keeps ownership of the `AudioContext`, master gain, and SFX, and hosts the engine
on a dedicated music-master gain so the existing volume slider and audio toggle keep working
unchanged.

### Consequences

* Good: richer, non-repetitive, theme-specific music with zero audio assets and no
  copyright concerns; volume/enable behaviour is unchanged for users.
* Good: all musical decisions live in pure modules covered by unit tests.
* Bad: more code and a modest, continuous CPU cost from running oscillators and a convolver.
* Bad: the engine itself depends on `AudioContext`, which jsdom does not provide, so the
  audio layer can only be smoke-tested via the served app / E2E rather than unit-tested.

## Pros and Cons of the Options

### Per-theme recorded loops

* Good, because authoring music in a DAW gives the most direct control over the sound.
* Bad, because it reintroduces audio assets and copyright exposure that
  [ADR-001](001-tech-stack.md) deliberately avoids, and adds bundle weight.
* Bad, because a recording is still a fixed loop; it does not morph over time.

### One fixed composed loop per theme

* Good, because it is simple and keeps the all-synthesis approach.
* Good, because it would already give each theme its own identity.
* Bad, because each theme is still a short, obvious loop with no long-form evolution, which
  is the main problem we are solving.

### Data-driven generative engine

* Good, because per-theme data yields distinct vibes and the scheduler morphs the
  arrangement so it never settles into a short loop.
* Good, because the musical logic is pure data and pure functions, so it is unit-testable
  and easy to retune.
* Bad, because it is the most code and carries a continuous synthesis cost, and the
  Web-Audio scheduler cannot be unit-tested under jsdom.
