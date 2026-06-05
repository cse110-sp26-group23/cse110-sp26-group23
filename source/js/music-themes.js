/**
 * @file Per-theme musical voicing data.
 *
 * Pure data consumed by music-engine.js. Each color theme maps to a
 * voicing object describing its key, scale, tempo, blendable chord
 * progressions, and the synth settings and probabilities for every voice
 * (pad, bass, optional drone, melody, ostinato, flourish). The engine
 * reads these fields to schedule and morph the arrangement; nothing here
 * touches the Web Audio API, so the data is unit-testable.
 *
 * Chord roots and melodic material are expressed as scale degrees relative
 * to the theme tonic, and chords as semitone intervals from their root, so
 * the engine resolves them with the helpers in music-theory.js. See
 * docs/decisions/016-generative-music.md.
 */

import { SCALES, noteNameToMidi } from './music-theory.js';

/**
 * Reusable chord voicings as semitone intervals from the chord root. Named
 * so progressions read musically rather than as bare number arrays.
 * @readonly
 */
const CHORD = Object.freeze({
  maj: [0, 4, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14],
  add9: [0, 4, 7, 14],
  minMaj7: [0, 3, 7, 11], // noir tension for the Blade-Runner palette
  lydian11: [0, 4, 7, 11, 18], // bright major with a #11 — "bright but wrong"
});

/**
 * Default — calming, bright, enjoyable lo-fi. Warm F major with ninth
 * colour, gentle plucks, and sparse pentatonic melodies.
 * @readonly
 */
const DEFAULT_VOICING = Object.freeze({
  name: 'default',
  root: noteNameToMidi('F3'),
  scale: SCALES.major,
  bpm: 75,
  beatsPerBar: 4,
  barsPerChord: 1,
  progressions: [
    { weight: 3, chords: [
      { degree: 0, intervals: CHORD.maj9 },
      { degree: 5, intervals: CHORD.min9 },
      { degree: 3, intervals: CHORD.maj9 },
      { degree: 4, intervals: CHORD.dom9 },
    ] },
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.maj9 },
      { degree: 3, intervals: CHORD.maj7 },
      { degree: 1, intervals: CHORD.min9 },
      { degree: 4, intervals: CHORD.dom9 },
    ] },
    { weight: 2, chords: [
      { degree: 5, intervals: CHORD.min9 },
      { degree: 3, intervals: CHORD.maj9 },
      { degree: 0, intervals: CHORD.maj9 },
      { degree: 4, intervals: CHORD.add9 },
    ] },
  ],
  pad: {
    types: ['triangle', 'sine'],
    detune: 6,
    gain: 0.34,
    attack: 1.5,
    release: 2.5,
    octaveShift: 0,
    filter: { cutoff: 1600, q: 0.6 },
    reverbSend: 0.18,
  },
  bass: { type: 'sine', gain: 0.16, attack: 0.05, release: 1.2, octaveShift: -12, reverbSend: 0 },
  drone: null,
  melody: {
    prob: 0.5,
    type: 'triangle',
    gain: 0.2,
    octaveShift: 12,
    glide: 0,
    reverbSend: 0.25,
    motifs: [
      [{ degree: 4, beats: 1 }, { degree: 5, beats: 1 }, { degree: 7, beats: 2 }],
      [{ degree: 2, beats: 1 }, { degree: 4, beats: 1 }, { degree: 5, beats: 1 }, { degree: 4, beats: 1 }],
      [{ rest: true, beats: 1 }, { degree: 7, beats: 1 }, { degree: 5, beats: 2 }],
      [{ degree: 0, beats: 2 }, { degree: 2, beats: 1 }, { degree: 4, beats: 1 }],
    ],
  },
  ostinato: {
    prob: 0.25,
    type: 'sine',
    gain: 0.08,
    octaveShift: 12,
    noteBeats: 0.5,
    pattern: [0, 2, 4, 2],
    reverbSend: 0.2,
  },
  flourish: {
    prob: 0.06,
    type: 'triangle',
    gain: 0.12,
    octaveShift: 24,
    noteBeats: 0.25,
    reverbSend: 0.3,
    motif: [0, 1, 2, 4, 5],
  },
});

/**
 * Yellow — bright on the surface but droning and liminal, inspired by the
 * backrooms. Lydian #4 tension over an almost-static tonic, a faint sharp
 * "fluorescent" hum, and rare hanging notes that never resolve.
 * @readonly
 */
const YELLOW_VOICING = Object.freeze({
  name: 'yellow',
  root: noteNameToMidi('C3'),
  scale: SCALES.lydian,
  bpm: 60,
  beatsPerBar: 4,
  barsPerChord: 4,
  progressions: [
    { weight: 4, chords: [{ degree: 0, intervals: CHORD.lydian11 }] },
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.add9 },
      { degree: 1, intervals: CHORD.add9 },
    ] },
    // A slow drift up the brighter degrees and back, so the harmony moves
    // without ever resolving away from the lydian colour.
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.lydian11 },
      { degree: 4, intervals: CHORD.add9 },
      { degree: 1, intervals: CHORD.add9 },
      { degree: 0, intervals: CHORD.maj7 },
    ] },
  ],
  pad: {
    types: ['sawtooth', 'triangle'],
    detune: 9,
    gain: 0.3,
    attack: 4,
    release: 5,
    octaveShift: 0,
    filter: { cutoff: 1400, q: 0.8, lfo: { rate: 0.05, depth: 200 } },
    reverbSend: 0.3,
  },
  bass: { type: 'sine', gain: 0.12, attack: 1.5, release: 4, octaveShift: -24, reverbSend: 0.1 },
  // Continuous hum voices give the "fluorescent light" stillness: a low
  // mains-like hum, a thin upper sine tuned slightly sharp so it beats
  // against the pad, and a quiet detuned saw fifth for body.
  drone: {
    filterCutoff: 900,
    voices: [
      { type: 'sine', semitones: -12, detune: 0, gain: 0.06 },
      { type: 'sine', semitones: 24, detune: 14, gain: 0.025 },
      { type: 'sawtooth', semitones: 7, detune: -5, gain: 0.03 },
    ],
  },
  melody: {
    prob: 0.3,
    type: 'sine',
    gain: 0.15,
    octaveShift: 12,
    glide: 0.3,
    reverbSend: 0.4,
    motifs: [
      [{ degree: 3, beats: 4 }],
      [{ degree: 6, beats: 3 }, { rest: true, beats: 1 }],
      [{ degree: 1, beats: 2 }, { rest: true, beats: 2 }],
      [{ degree: 4, beats: 1 }, { degree: 6, beats: 1 }, { degree: 3, beats: 2 }],
      [{ rest: true, beats: 1 }, { degree: 7, beats: 2 }, { degree: 6, beats: 1 }],
      [{ degree: 2, beats: 1 }, { degree: 3, beats: 1 }, { rest: true, beats: 2 }],
    ],
  },
  // A faint, slow high arpeggio circling the #4 — adds quiet motion to the
  // stillness without breaking the liminal hush.
  ostinato: {
    prob: 0.4,
    type: 'sine',
    gain: 0.05,
    octaveShift: 12,
    noteBeats: 1,
    pattern: [4, 6, 3, 6],
    reverbSend: 0.45,
  },
  flourish: {
    prob: 0.08,
    type: 'sine',
    gain: 0.09,
    octaveShift: 24,
    noteBeats: 1,
    reverbSend: 0.5,
    motif: [3, 6],
  },
});

/**
 * Purple — vaporwave / sci-fi / Blade-Runner. Lush, slow A-minor with
 * detuned saw pads, heavy reverb, a slow filter sweep, sub bass, and a
 * smooth gliding lead.
 * @readonly
 */
const PURPLE_VOICING = Object.freeze({
  name: 'purple',
  root: noteNameToMidi('A2'),
  scale: SCALES.minor,
  bpm: 66,
  beatsPerBar: 4,
  barsPerChord: 2,
  progressions: [
    { weight: 3, chords: [
      { degree: 0, intervals: CHORD.min9 },
      { degree: 5, intervals: CHORD.maj9 },
      { degree: 2, intervals: CHORD.maj9 },
      { degree: 6, intervals: CHORD.dom7 },
    ] },
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.min9 },
      { degree: 3, intervals: CHORD.min9 },
      { degree: 5, intervals: CHORD.maj9 },
      { degree: 4, intervals: CHORD.minMaj7 },
    ] },
    { weight: 2, chords: [
      { degree: 5, intervals: CHORD.maj9 },
      { degree: 6, intervals: CHORD.dom7 },
      { degree: 0, intervals: CHORD.min9 },
      { degree: 0, intervals: CHORD.min7 },
    ] },
  ],
  pad: {
    types: ['sawtooth', 'sawtooth', 'triangle'],
    detune: 14,
    gain: 0.3,
    attack: 2.5,
    release: 4,
    octaveShift: 0,
    filter: { cutoff: 1200, q: 1.2, lfo: { rate: 0.07, depth: 500 } },
    reverbSend: 0.5,
  },
  bass: { type: 'sine', gain: 0.17, attack: 0.08, release: 2, octaveShift: -24, reverbSend: 0.1 },
  drone: null,
  melody: {
    prob: 0.4,
    type: 'triangle',
    gain: 0.18,
    octaveShift: 12,
    glide: 0.12,
    reverbSend: 0.45,
    motifs: [
      [{ degree: 7, beats: 3 }, { degree: 6, beats: 1 }, { degree: 4, beats: 4 }],
      [{ degree: 4, beats: 2 }, { degree: 2, beats: 2 }, { degree: 0, beats: 4 }],
      [{ rest: true, beats: 2 }, { degree: 9, beats: 2 }, { degree: 7, beats: 4 }],
    ],
  },
  ostinato: {
    prob: 0.2,
    type: 'triangle',
    gain: 0.07,
    octaveShift: 12,
    noteBeats: 1,
    pattern: [0, 4, 7, 4],
    reverbSend: 0.4,
  },
  flourish: {
    prob: 0.07,
    type: 'sine',
    gain: 0.1,
    octaveShift: 24,
    noteBeats: 0.5,
    reverbSend: 0.55,
    motif: [0, 2, 4, 7],
  },
});

/**
 * Orange — energetic sci-fi, brighter and more driving than purple but
 * still background-friendly. Up-tempo D dorian with a prominent 16th-note
 * arpeggiated ostinato, resonant filtering, and a punchy on-beat bass.
 * @readonly
 */
const ORANGE_VOICING = Object.freeze({
  name: 'orange',
  root: noteNameToMidi('D3'),
  scale: SCALES.dorian,
  bpm: 98,
  beatsPerBar: 4,
  barsPerChord: 1,
  progressions: [
    { weight: 3, chords: [
      { degree: 0, intervals: CHORD.min7 },
      { degree: 6, intervals: CHORD.maj },
      { degree: 5, intervals: CHORD.maj },
      { degree: 6, intervals: CHORD.maj },
    ] },
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.min7 },
      { degree: 3, intervals: CHORD.min7 },
      { degree: 6, intervals: CHORD.maj },
      { degree: 5, intervals: CHORD.maj },
    ] },
    { weight: 2, chords: [
      { degree: 0, intervals: CHORD.min7 },
      { degree: 5, intervals: CHORD.maj },
      { degree: 2, intervals: CHORD.maj7 },
      { degree: 6, intervals: CHORD.maj },
    ] },
  ],
  pad: {
    types: ['sawtooth', 'triangle'],
    detune: 8,
    gain: 0.24,
    attack: 0.8,
    release: 1.5,
    octaveShift: 0,
    filter: { cutoff: 1600, q: 1.5, lfo: { rate: 0.5, depth: 400 } },
    reverbSend: 0.25,
  },
  bass: {
    type: 'triangle', gain: 0.19, attack: 0.02, release: 0.5, octaveShift: -12, reverbSend: 0.05,
    pulseBeats: 1,
  },
  drone: null,
  melody: {
    prob: 0.5,
    type: 'square',
    gain: 0.13,
    octaveShift: 12,
    glide: 0,
    reverbSend: 0.3,
    motifs: [
      [{ degree: 0, beats: 0.5 }, { degree: 2, beats: 0.5 }, { degree: 4, beats: 1 }, { degree: 3, beats: 1 }, { degree: 0, beats: 1 }],
      [{ degree: 7, beats: 1 }, { degree: 6, beats: 0.5 }, { degree: 4, beats: 0.5 }, { degree: 2, beats: 2 }],
      [{ rest: true, beats: 1 }, { degree: 4, beats: 1 }, { degree: 5, beats: 1 }, { degree: 4, beats: 1 }],
    ],
  },
  ostinato: {
    prob: 0.7,
    type: 'sawtooth',
    gain: 0.1,
    octaveShift: 12,
    noteBeats: 0.25,
    pattern: [0, 2, 4, 6, 7, 6, 4, 2],
    reverbSend: 0.2,
    filter: { cutoff: 1900, q: 3 },
  },
  flourish: {
    prob: 0.1,
    type: 'square',
    gain: 0.11,
    octaveShift: 24,
    noteBeats: 0.25,
    reverbSend: 0.25,
    motif: [0, 2, 4, 7],
  },
});

/**
 * All theme voicings keyed by the theme name used in settings.js `THEMES`.
 * @readonly
 */
export const THEME_VOICINGS = Object.freeze({
  default: DEFAULT_VOICING,
  yellow: YELLOW_VOICING,
  purple: PURPLE_VOICING,
  orange: ORANGE_VOICING,
});

/**
 * Returns the voicing for a theme name, falling back to the default
 * voicing for unknown or missing names.
 * @param {string} name - Theme name (e.g. `"purple"`).
 * @returns {object} The matching theme voicing, or the default voicing.
 */
export function getThemeVoicing(name) {
  return THEME_VOICINGS[name] || DEFAULT_VOICING;
}
