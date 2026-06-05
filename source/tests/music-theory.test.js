import {
  midiToFreq,
  pitchClass,
  noteNameToMidi,
  SCALES,
  scaleDegreeToMidi,
  chordNotes,
  transpose,
  sharesCommonTone,
  weightedPick,
} from '../js/music-theory.js';

describe('midiToFreq', () => {
  it('maps A4 (69) to 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('is an octave (2x) higher one octave up', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6);
  });

  it('maps middle C (60) to ~261.63 Hz', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.626, 2);
  });
});

describe('pitchClass', () => {
  it('wraps into 0..11 for positive and negative notes', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(61)).toBe(1);
    expect(pitchClass(-1)).toBe(11);
  });
});

describe('noteNameToMidi', () => {
  it('maps C4 to 60', () => {
    expect(noteNameToMidi('C4')).toBe(60);
  });

  it('maps A4 to 69', () => {
    expect(noteNameToMidi('A4')).toBe(69);
  });

  it('applies sharps and flats', () => {
    expect(noteNameToMidi('F#3')).toBe(54);
    expect(noteNameToMidi('Bb2')).toBe(46);
  });

  it('handles negative octaves', () => {
    expect(noteNameToMidi('C-1')).toBe(0);
  });

  it('throws on an invalid name', () => {
    expect(() => noteNameToMidi('H9')).toThrowError(/Invalid note name/);
  });
});

describe('scaleDegreeToMidi', () => {
  const root = 60; // C4

  it('returns the tonic for degree 0', () => {
    expect(scaleDegreeToMidi(root, SCALES.major, 0)).toBe(60);
  });

  it('walks up the major scale', () => {
    expect(scaleDegreeToMidi(root, SCALES.major, 1)).toBe(62); // D
    expect(scaleDegreeToMidi(root, SCALES.major, 4)).toBe(67); // G
  });

  it('wraps a full scale length to the octave', () => {
    expect(scaleDegreeToMidi(root, SCALES.major, 7)).toBe(72); // C5
  });

  it('wraps negative degrees down an octave', () => {
    expect(scaleDegreeToMidi(root, SCALES.major, -1)).toBe(59); // B3
  });
});

describe('chordNotes', () => {
  it('adds intervals to the root', () => {
    expect(chordNotes(60, [0, 4, 7])).toEqual([60, 64, 67]);
  });
});

describe('transpose', () => {
  it('shifts a note by semitones', () => {
    expect(transpose(60, 12)).toBe(72);
    expect(transpose(60, -5)).toBe(55);
  });
});

describe('sharesCommonTone', () => {
  it('detects a shared pitch class across octaves', () => {
    // C major and A minor both contain C (pitch class 0) / E (4).
    expect(sharesCommonTone([60, 64, 67], [69, 72, 76])).toBe(true);
  });

  it('returns false when no pitch class is shared', () => {
    expect(sharesCommonTone([60, 64, 67], [61, 66, 68])).toBe(false);
  });
});

describe('weightedPick', () => {
  it('returns the only item for a single-element list', () => {
    expect(weightedPick(['x'], [1])).toBe('x');
  });

  it('returns undefined for an empty list', () => {
    expect(weightedPick([], [])).toBeUndefined();
  });

  it('falls back to uniform choice when all weights are zero', () => {
    const got = weightedPick(['a', 'b'], [0, 0], () => 0.99);
    expect(['a', 'b']).toContain(got);
  });

  it('honours weights via a deterministic rng', () => {
    // total weight 10; rng 0.5 -> 5, lands inside the second (weight 9) bucket.
    expect(weightedPick(['a', 'b'], [1, 9], () => 0.5)).toBe('b');
    // rng 0.05 -> 0.5, lands in the first (weight 1) bucket.
    expect(weightedPick(['a', 'b'], [1, 9], () => 0.05)).toBe('a');
  });

  it('uses uniform choice when weights length mismatches', () => {
    expect(weightedPick(['a', 'b'], [1], () => 0)).toBe('a');
  });
});
