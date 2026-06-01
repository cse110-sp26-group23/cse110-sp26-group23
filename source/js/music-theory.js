/**
 * @file Music theory helpers.
 *
 * Pure, DOM-free utilities shared by the generative music engine and the
 * per-theme voicing data: note/frequency conversion, scales, chord and
 * scale-degree resolution, weighted random selection, and a common-tone
 * test used to blend chord progressions smoothly.
 *
 * Everything here is a pure function or a frozen constant so it can be
 * unit-tested without a Web Audio context. See
 * docs/decisions/016-generative-music.md.
 */

/**
 * Converts a MIDI note number to its frequency in Hz using equal
 * temperament with A4 (MIDI 69) = 440 Hz.
 * @param {number} midi - MIDI note number (60 = middle C).
 * @returns {number} Frequency in Hz.
 */
export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Wraps a MIDI note into its pitch class (0..11, where 0 = C).
 * @param {number} midi - MIDI note number.
 * @returns {number} Pitch class in 0..11.
 */
export function pitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

/** Semitone offset of each natural note letter from C. @readonly */
const LETTER_SEMITONES = Object.freeze({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 });

/**
 * Parses a scientific-pitch note name (e.g. `"C4"`, `"F#3"`, `"Bb2"`,
 * `"C-1"`) into a MIDI note number, where C4 = 60. Accidentals stack, so
 * `"Cbb4"` and `"D##3"` are accepted.
 * @param {string} name - Note name: letter, optional `#`/`b` run, octave.
 * @returns {number} MIDI note number.
 * @throws {Error} If the name is not a valid pitch.
 */
export function noteNameToMidi(name) {
  const match = /^([A-Ga-g])([#b]*)(-?\d+)$/.exec(String(name).trim());
  if (!match) throw new Error(`Invalid note name: ${name}`);
  const base = LETTER_SEMITONES[match[1].toLowerCase()];
  let accidental = 0;
  for (const ch of match[2]) accidental += ch === '#' ? 1 : -1;
  const octave = parseInt(match[3], 10);
  return (octave + 1) * 12 + base + accidental;
}

/**
 * Scale templates as semitone offsets from the tonic. Used to resolve
 * scale degrees into concrete notes. Pentatonic scales are five-note so
 * degree wrapping skips the "outside" steps.
 * @readonly
 */
export const SCALES = Object.freeze({
  major: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  minor: Object.freeze([0, 2, 3, 5, 7, 8, 10]),
  dorian: Object.freeze([0, 2, 3, 5, 7, 9, 10]),
  lydian: Object.freeze([0, 2, 4, 6, 7, 9, 11]),
  mixolydian: Object.freeze([0, 2, 4, 5, 7, 9, 10]),
  harmonicMinor: Object.freeze([0, 2, 3, 5, 7, 8, 11]),
  majorPentatonic: Object.freeze([0, 2, 4, 7, 9]),
  minorPentatonic: Object.freeze([0, 3, 5, 7, 10]),
});

/**
 * Resolves a scale degree to a MIDI note. Degrees outside `0..length-1`
 * wrap with octave shifts in both directions, so degree `7` of a 7-note
 * scale is the tonic an octave up and degree `-1` is the leading tone an
 * octave down.
 * @param {number} rootMidi - MIDI note of the scale tonic.
 * @param {ReadonlyArray<number>} scale - Semitone offsets from the tonic.
 * @param {number} degree - Zero-based scale degree (may be negative or > length).
 * @returns {number} MIDI note number.
 */
export function scaleDegreeToMidi(rootMidi, scale, degree) {
  const len = scale.length;
  const octave = Math.floor(degree / len);
  const index = ((degree % len) + len) % len;
  return rootMidi + octave * 12 + scale[index];
}

/**
 * Builds chord notes by adding each semitone interval to a root note.
 * @param {number} rootMidi - MIDI note of the chord root.
 * @param {ReadonlyArray<number>} intervals - Semitone offsets from the root.
 * @returns {number[]} MIDI note numbers of the chord.
 */
export function chordNotes(rootMidi, intervals) {
  return intervals.map((interval) => rootMidi + interval);
}

/**
 * Transposes a MIDI note by a number of semitones.
 * @param {number} midi - MIDI note number.
 * @param {number} semitones - Signed semitone shift.
 * @returns {number} Transposed MIDI note number.
 */
export function transpose(midi, semitones) {
  return midi + semitones;
}

/**
 * Returns true if two sets of notes share at least one pitch class, i.e.
 * they have a common tone regardless of octave. Used to choose the next
 * chord progression so transitions blend rather than jump.
 * @param {ReadonlyArray<number>} a - First set of MIDI notes.
 * @param {ReadonlyArray<number>} b - Second set of MIDI notes.
 * @returns {boolean} Whether the two sets share a pitch class.
 */
export function sharesCommonTone(a, b) {
  const classes = new Set(a.map(pitchClass));
  return b.some((note) => classes.has(pitchClass(note)));
}

/**
 * Picks one item from a list using optional non-negative weights. With no
 * usable weights (missing, length mismatch, or all-zero) the choice is
 * uniform. Empty input yields `undefined`.
 * @param {ReadonlyArray<*>} items - Candidates to choose from.
 * @param {ReadonlyArray<number>} [weights] - Parallel non-negative weights.
 * @param {function(): number} [rng] - Returns a float in [0, 1); defaults to Math.random.
 * @returns {*} The chosen item, or undefined if `items` is empty.
 */
export function weightedPick(items, weights, rng = Math.random) {
  if (!items || items.length === 0) return undefined;
  const uniform = () => items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
  if (!weights || weights.length !== items.length) return uniform();

  let total = 0;
  for (const weight of weights) total += Math.max(0, weight);
  if (total <= 0) return uniform();

  let r = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= Math.max(0, weights[i]);
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}
