import { THEME_VOICINGS, getThemeVoicing } from '../js/music-themes.js';
import { SCALES } from '../js/music-theory.js';
import { THEMES } from '../js/settings.js';

const SCALE_SET = new Set(Object.values(SCALES));

describe('theme voicing coverage', () => {
  it('defines a voicing for every theme in settings THEMES', () => {
    for (const name of THEMES) {
      expect(THEME_VOICINGS[name]).withContext(name).toBeDefined();
    }
  });

  it('falls back to the default voicing for unknown names', () => {
    expect(getThemeVoicing('not-a-theme')).toBe(THEME_VOICINGS.default);
    expect(getThemeVoicing(undefined)).toBe(THEME_VOICINGS.default);
  });

  it('returns the requested voicing by name', () => {
    expect(getThemeVoicing('purple')).toBe(THEME_VOICINGS.purple);
  });
});

describe('theme voicing structure', () => {
  const inUnit = (v) => typeof v === 'number' && v >= 0 && v <= 1;

  Object.entries(THEME_VOICINGS).forEach(([name, v]) => {
    describe(name, () => {
      it('has a valid tempo and metre', () => {
        expect(v.bpm).toBeGreaterThan(0);
        expect(v.beatsPerBar).toBeGreaterThan(0);
        expect(v.barsPerChord).toBeGreaterThan(0);
      });

      it('uses a known scale and an integer root', () => {
        expect(SCALE_SET.has(v.scale)).toBe(true);
        expect(Number.isInteger(v.root)).toBe(true);
      });

      it('has non-empty progressions of non-empty chords', () => {
        expect(v.progressions.length).toBeGreaterThan(0);
        for (const prog of v.progressions) {
          expect(prog.chords.length).toBeGreaterThan(0);
          for (const chord of prog.chords) {
            expect(Number.isInteger(chord.degree)).toBe(true);
            expect(Array.isArray(chord.intervals)).toBe(true);
            expect(chord.intervals.length).toBeGreaterThan(0);
            expect(chord.intervals.every(Number.isInteger)).toBe(true);
          }
        }
      });

      it('has a pad with a unit-range reverb send and gain', () => {
        expect(v.pad.types.length).toBeGreaterThan(0);
        expect(inUnit(v.pad.reverbSend)).toBe(true);
        expect(v.pad.gain).toBeGreaterThan(0);
        expect(v.pad.filter.cutoff).toBeGreaterThan(0);
      });

      it('keeps every voice probability and send in 0..1', () => {
        for (const key of ['melody', 'ostinato', 'flourish']) {
          const voice = v[key];
          if (!voice) continue;
          expect(inUnit(voice.prob)).withContext(`${key}.prob`).toBe(true);
          expect(inUnit(voice.reverbSend)).withContext(`${key}.reverbSend`).toBe(true);
          expect(voice.gain).toBeGreaterThan(0);
          expect(Number.isInteger(voice.octaveShift)).toBe(true);
        }
      });

      it('has melody motifs with positive note durations', () => {
        if (!v.melody) return;
        expect(v.melody.motifs.length).toBeGreaterThan(0);
        for (const motif of v.melody.motifs) {
          expect(motif.length).toBeGreaterThan(0);
          for (const note of motif) {
            expect(note.beats).toBeGreaterThan(0);
            if (!note.rest) expect(Number.isInteger(note.degree)).toBe(true);
          }
        }
      });

      it('has integer scale-degree patterns for ostinato and flourish', () => {
        if (v.ostinato) {
          expect(v.ostinato.noteBeats).toBeGreaterThan(0);
          expect(v.ostinato.pattern.every(Number.isInteger)).toBe(true);
        }
        if (v.flourish) {
          expect(v.flourish.motif.every(Number.isInteger)).toBe(true);
        }
      });
    });
  });
});
