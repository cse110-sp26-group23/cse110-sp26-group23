import { compareText } from '../js/inputPane.js';

// compareText backs the per-character highlighting in source/js/inputPane.js.
// These tests pin its contract directly, without driving the DOM. The astral
// case below is the regression guard that previously lived in the E2E suite
// (a level whose locked scaffold contained an emoji): indexing the typed text
// by UTF-16 code unit would split a surrogate pair and shift every comparison
// after the emoji, falsely reddening characters that actually match.

describe('compareText', () => {
  it('marks matching characters correct', () => {
    const result = compareText('abc', 'abc');

    expect(result.map((c) => c.status)).toEqual(['correct', 'correct', 'correct']);
    expect(result.map((c) => c.char).join('')).toBe('abc');
  });

  it('marks untyped characters pending', () => {
    const result = compareText('abc', 'a');

    expect(result.map((c) => c.status)).toEqual(['correct', 'pending', 'pending']);
  });

  it('marks a mismatch incorrect and carries the typed character', () => {
    const result = compareText('abc', 'aXc');

    expect(result[1].status).toBe('incorrect');
    // The slot shows what was actually typed (red), not the expected char.
    expect(result[1].char).toBe('X');
  });

  it('indexes by code point so text after an astral emoji is not shifted', () => {
    // "🦊" is one code point but two UTF-16 code units. Both strings match
    // exactly, so every slot must be correct.
    const prompt = '🦊ab';
    const result = compareText(prompt, prompt);

    expect(result.length).toBe(3);
    expect(result.map((c) => c.status)).toEqual(['correct', 'correct', 'correct']);
    expect(result.map((c) => c.char)).toEqual(['🦊', 'a', 'b']);
  });

  it('flags only the genuinely wrong character when an astral emoji precedes it', () => {
    const result = compareText('🦊abc', '🦊aXc');

    expect(result.map((c) => c.status)).toEqual([
      'correct',
      'correct',
      'incorrect',
      'correct',
    ]);
    expect(result[2].char).toBe('X');
  });
});
