/**
 * @file Generative music engine.
 *
 * The Web Audio half of the music system. Given an AudioContext and a
 * destination node, it plays a per-theme voicing (see music-themes.js) by
 * running a bar/chord look-ahead scheduler that layers pad, bass, optional
 * drone, melody, ostinato, and flourish voices. A slow deterministic
 * "intensity" curve swells and recedes the density so the arrangement
 * morphs over minutes instead of looping, and chord progressions are
 * chosen to share a common tone so transitions blend. Changing theme
 * crossfades between two voice buses.
 *
 * A single ConvolverNode built from a synthesized decaying-noise impulse
 * provides shared reverb; each voice sends to it at a per-voice level.
 *
 * All musical decisions defer to the pure helpers in music-theory.js so
 * this module only concerns itself with scheduling and node wiring. See
 * docs/decisions/016-generative-music.md.
 */

import {
  midiToFreq,
  scaleDegreeToMidi,
  chordNotes,
  sharesCommonTone,
  weightedPick,
} from './music-theory.js';
import { getThemeVoicing } from './music-themes.js';

/** Seconds to crossfade between themes. */
const CROSSFADE = 2.5;
/** Scheduler tick period in milliseconds. */
const TICK_MS = 60;
/** How far ahead of the audio clock chord spans are scheduled, in seconds. */
const LOOKAHEAD = 0.3;
/** Length of the synthesized reverb impulse, in seconds. */
const REVERB_SECONDS = 2.6;

/**
 * Builds a stereo impulse response of exponentially-decaying white noise,
 * giving the ConvolverNode a smooth synthetic hall without any audio file.
 * @param {AudioContext} ctx - The audio context.
 * @returns {AudioBuffer} The impulse response buffer.
 */
function buildReverbImpulse(ctx) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * REVERB_SECONDS);
  const impulse = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      // White noise tapered by an exponential so the tail fades naturally.
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
  }
  return impulse;
}

/**
 * Schedules a single enveloped tone and routes it to a dry destination and
 * (optionally) the shared reverb bus. Used for melody, ostinato, and
 * flourish notes.
 * @param {object} p - Parameters.
 * @param {AudioContext} p.ctx - Audio context.
 * @param {AudioNode} p.dest - Dry destination (a theme bus).
 * @param {AudioNode} [p.reverbBus] - Shared reverb input; omit to stay dry.
 * @param {number} p.time - Start time on the audio clock.
 * @param {number} p.freq - Frequency in Hz.
 * @param {number} p.dur - Note length in seconds (excluding release tail).
 * @param {OscillatorType} p.type - Oscillator waveform.
 * @param {number} p.gain - Peak gain before master scaling.
 * @param {number} [p.attack] - Attack time in seconds.
 * @param {number} [p.release] - Release time in seconds.
 * @param {number} [p.send] - Reverb send level in 0..1.
 * @param {number} [p.glideFrom] - Frequency to glide from (portamento).
 * @param {number} [p.glide] - Glide time in seconds.
 * @param {{cutoff: number, q: number}} [p.filter] - Optional low-pass on the tone.
 */
function scheduleTone(p) {
  const { ctx, dest, reverbBus, time, freq, dur, type, gain } = p;
  const attack = p.attack ?? 0.01;
  const release = p.release ?? 0.3;

  const osc = ctx.createOscillator();
  osc.type = type;
  if (p.glide && p.glideFrom) {
    osc.frequency.setValueAtTime(p.glideFrom, time);
    osc.frequency.linearRampToValueAtTime(freq, time + p.glide);
  } else {
    osc.frequency.setValueAtTime(freq, time);
  }

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(gain, time + attack);
  env.gain.setValueAtTime(gain, time + Math.max(attack, dur));
  env.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(attack, dur) + release);

  let head = osc;
  if (p.filter) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = p.filter.cutoff;
    filter.Q.value = p.filter.q;
    osc.connect(filter);
    head = filter;
  }
  head.connect(env);
  env.connect(dest);
  if (reverbBus && p.send) {
    const sendGain = ctx.createGain();
    sendGain.gain.value = p.send;
    env.connect(sendGain);
    sendGain.connect(reverbBus);
  }

  osc.start(time);
  osc.stop(time + Math.max(attack, dur) + release + 0.05);
}

/**
 * Creates a running player for one theme voicing: its own master gain (for
 * crossfades), continuous drone voices, and a chord-span look-ahead
 * scheduler. The player starts scheduling immediately.
 * @param {object} deps - Engine dependencies.
 * @param {AudioContext} deps.ctx - Audio context.
 * @param {AudioNode} deps.destination - Node the player's master feeds.
 * @param {AudioNode} deps.reverbBus - Shared reverb input bus.
 * @param {object} voicing - A theme voicing from music-themes.js.
 * @param {object} [opts] - Playback options.
 * @param {number} [opts.phase] - Starting chord-span index, so the morph
 *   "clock" resumes where a previous page left off (see music handoff).
 * @param {number} [opts.fadeIn] - Seconds to fade the player in from silence;
 *   omit or 0 to start at full level.
 * @returns {{ master: GainNode, getPhase: function(): number, stop: function(number): void }}
 *   The player handle.
 */
function createThemePlayer({ ctx, destination, reverbBus }, voicing, opts = {}) {
  const fadeIn = opts.fadeIn || 0;
  const master = ctx.createGain();
  master.gain.value = fadeIn > 0 ? 0 : 1;
  master.connect(destination);
  if (fadeIn > 0) master.gain.setTargetAtTime(1, ctx.currentTime, fadeIn / 3);

  const { root, scale, bpm, beatsPerBar, barsPerChord } = voicing;
  const secondsPerBeat = 60 / bpm;
  const spanSeconds = secondsPerBeat * beatsPerBar * barsPerChord;

  /** Long-lived nodes (drone oscillators) to tear down on stop. */
  const droneNodes = [];

  // Continuous drone voices (used by the liminal yellow theme) run for the
  // player's whole lifetime rather than per chord span.
  if (voicing.drone) {
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = voicing.drone.filterCutoff;
    droneFilter.connect(master);
    for (const voice of voicing.drone.voices) {
      const osc = ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = midiToFreq(root + voice.semitones);
      osc.detune.value = voice.detune || 0;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(voice.gain, ctx.currentTime, 2);
      osc.connect(g);
      g.connect(droneFilter);
      osc.start();
      droneNodes.push({ osc, g });
    }
  }

  // Progression / chord cursor.
  let progression = weightedPick(
    voicing.progressions,
    voicing.progressions.map((pr) => pr.weight ?? 1),
  );
  let chordPos = 0;
  let lastChordMidi = null;
  let spanIndex = opts.phase || 0;
  let nextSpanTime = ctx.currentTime + 0.15;

  /**
   * Slow deterministic density in 0..1, summed from two slow sines so it
   * swells and recedes over minutes without ever repeating tightly.
   * @param {number} index - Chord-span index.
   * @returns {number} Intensity in 0..1.
   */
  function intensity(index) {
    const v = 0.6 * Math.sin(index * 0.21) + 0.4 * Math.sin(index * 0.073 + 1.3);
    return Math.max(0, Math.min(1, 0.5 + 0.5 * v));
  }

  /** Resolves a scale degree (plus a semitone shift) to a frequency. */
  function degreeFreq(degree, semitoneShift) {
    return midiToFreq(scaleDegreeToMidi(root, scale, degree) + semitoneShift);
  }

  /** Schedules the sustained pad for a chord across the whole span. */
  function schedulePad(notes, time) {
    const pad = voicing.pad;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = pad.filter.cutoff;
    filter.Q.value = pad.filter.q;

    let lfo = null;
    let lfoGain = null;
    if (pad.filter.lfo) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = pad.filter.lfo.rate;
      lfoGain = ctx.createGain();
      lfoGain.gain.value = pad.filter.lfo.depth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
    }

    const env = ctx.createGain();
    const peak = pad.gain;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peak, time + pad.attack);
    env.gain.setValueAtTime(peak, time + spanSeconds);
    env.gain.exponentialRampToValueAtTime(0.0001, time + spanSeconds + pad.release);
    filter.connect(env);
    env.connect(master);
    if (pad.reverbSend) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = pad.reverbSend;
      env.connect(sendGain);
      sendGain.connect(reverbBus);
    }

    const oscillators = [];
    const stack = pad.types.length;
    for (const note of notes) {
      const baseFreq = midiToFreq(note + pad.octaveShift);
      pad.types.forEach((type, i) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = baseFreq;
        osc.detune.value = (i - (stack - 1) / 2) * pad.detune;
        const og = ctx.createGain();
        og.gain.value = 1 / (notes.length * stack);
        osc.connect(og);
        og.connect(filter);
        oscillators.push(osc);
      });
    }

    const end = time + spanSeconds + pad.release + 0.05;
    oscillators.forEach((osc) => { osc.start(time); osc.stop(end); });
    if (lfo) { lfo.start(time); lfo.stop(end); }
  }

  /** Schedules the bass: one sustained note, or a pulse on each beat. */
  function scheduleBass(rootMidi, time) {
    const bass = voicing.bass;
    if (!bass) return;
    const freq = midiToFreq(rootMidi + bass.octaveShift);
    if (bass.pulseBeats) {
      const step = bass.pulseBeats * secondsPerBeat;
      for (let t = 0; t + 0.0001 < spanSeconds; t += step) {
        scheduleTone({
          ctx, dest: master, reverbBus, time: time + t, freq, dur: step * 0.9,
          type: bass.type, gain: bass.gain, attack: bass.attack, release: bass.release,
          send: bass.reverbSend,
        });
      }
    } else {
      scheduleTone({
        ctx, dest: master, reverbBus, time, freq, dur: spanSeconds,
        type: bass.type, gain: bass.gain, attack: bass.attack, release: bass.release,
        send: bass.reverbSend,
      });
    }
  }

  /** Probabilistically schedules a melody motif over the span. */
  function scheduleMelody(time, density) {
    const m = voicing.melody;
    if (!m) return;
    if (Math.random() > m.prob * (0.4 + 0.6 * density)) return;
    const motif = weightedPick(m.motifs);
    let t = time;
    let prevFreq = null;
    for (const note of motif) {
      const dur = note.beats * secondsPerBeat;
      if (!note.rest) {
        const freq = degreeFreq(note.degree, m.octaveShift);
        scheduleTone({
          ctx, dest: master, reverbBus, time: t, freq, dur: dur * 0.95,
          type: m.type, gain: m.gain, attack: 0.02, release: 0.4, send: m.reverbSend,
          glideFrom: prevFreq, glide: m.glide,
        });
        prevFreq = freq;
      }
      t += dur;
    }
  }

  /** Probabilistically fills the span with the repeating ostinato pattern. */
  function scheduleOstinato(time, density) {
    const o = voicing.ostinato;
    if (!o) return;
    if (Math.random() > o.prob * (0.4 + 0.6 * density)) return;
    const step = o.noteBeats * secondsPerBeat;
    const count = Math.floor(spanSeconds / step);
    for (let i = 0; i < count; i += 1) {
      const degree = o.pattern[i % o.pattern.length];
      scheduleTone({
        ctx, dest: master, reverbBus, time: time + i * step,
        freq: degreeFreq(degree, o.octaveShift), dur: step * 0.85,
        type: o.type, gain: o.gain, attack: 0.005, release: 0.12,
        send: o.reverbSend, filter: o.filter,
      });
    }
  }

  /** Rarely schedules a short flourish run near the start of the span. */
  function scheduleFlourish(time, density) {
    const f = voicing.flourish;
    if (!f) return;
    if (Math.random() > f.prob * (0.5 + 0.5 * density)) return;
    const step = f.noteBeats * secondsPerBeat;
    f.motif.forEach((degree, i) => {
      scheduleTone({
        ctx, dest: master, reverbBus, time: time + i * step,
        freq: degreeFreq(degree, f.octaveShift), dur: step * 0.9,
        type: f.type, gain: f.gain, attack: 0.005, release: 0.5, send: f.reverbSend,
      });
    });
  }

  /** Schedules every voice for the current chord, then advances the cursor. */
  function scheduleSpan(time) {
    const chord = progression.chords[chordPos];
    const chordRootMidi = scaleDegreeToMidi(root, scale, chord.degree);
    const notes = chordNotes(chordRootMidi, chord.intervals);
    const density = intensity(spanIndex);

    schedulePad(notes, time);
    scheduleBass(chordRootMidi, time);
    scheduleMelody(time, density);
    scheduleOstinato(time, density);
    scheduleFlourish(time, density);

    lastChordMidi = notes;
    spanIndex += 1;
    chordPos += 1;
    if (chordPos >= progression.chords.length) {
      // Pick the next progression so its first chord shares a tone with the
      // chord we just played, blending the seam.
      const weights = voicing.progressions.map((pr) => {
        const firstChord = pr.chords[0];
        const firstNotes = chordNotes(
          scaleDegreeToMidi(root, scale, firstChord.degree),
          firstChord.intervals,
        );
        const base = pr.weight ?? 1;
        return lastChordMidi && sharesCommonTone(lastChordMidi, firstNotes) ? base * 3 : base;
      });
      progression = weightedPick(voicing.progressions, weights);
      chordPos = 0;
    }
  }

  function tick() {
    while (nextSpanTime < ctx.currentTime + LOOKAHEAD) {
      scheduleSpan(nextSpanTime);
      nextSpanTime += spanSeconds;
    }
  }
  tick();
  const ticker = setInterval(tick, TICK_MS);

  return {
    master,
    /**
     * @returns {number} The current chord-span index, used to hand the
     *   morph phase to the next page.
     */
    getPhase() {
      return spanIndex;
    },
    /**
     * Fades the player out over `fade` seconds, stops scheduling, and
     * releases its drone nodes.
     * @param {number} fade - Fade-out time in seconds.
     */
    stop(fade) {
      clearInterval(ticker);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0, now, Math.max(0.05, fade / 3));
      for (const { osc, g } of droneNodes) {
        g.gain.setTargetAtTime(0, now, fade / 3);
        osc.stop(now + fade + 0.2);
      }
      // Disconnect the master after the fade so the node graph is released.
      setTimeout(() => {
        try { master.disconnect(); } catch { /* already gone */ }
      }, (fade + 0.5) * 1000);
    },
  };
}

/**
 * Creates the generative music engine. The engine owns the shared reverb
 * and the currently-playing theme player, and exposes a small lifecycle
 * API. It does not touch settings or volume; the caller routes
 * `destination` through its own master gain.
 *
 * @param {object} deps - Dependencies.
 * @param {AudioContext} deps.ctx - The shared audio context.
 * @param {AudioNode} deps.destination - Node the music mix feeds into.
 * @returns {{ start: function(string, object=): void, stop: function(): void, setTheme: function(string): void, isRunning: function(): boolean, getState: function(): {theme: ?string, phase: number} }}
 *   The engine handle.
 */
export function createMusicEngine({ ctx, destination }) {
  // Shared reverb: voices send here, it convolves and feeds the mix.
  const reverbBus = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = buildReverbImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.9;
  reverbBus.connect(convolver);
  convolver.connect(wet);
  wet.connect(destination);

  /** @type {{ master: GainNode, stop: function(number): void } | null} */
  let current = null;
  let currentName = null;

  return {
    /**
     * Starts playing the given theme. No-op if already playing.
     * @param {string} themeName - Theme name (see settings.js THEMES).
     * @param {object} [opts] - Forwarded to the player: `{ phase, fadeIn }`
     *   to resume the morph phase and fade in from a previous page.
     */
    start(themeName, opts = {}) {
      if (current) return;
      currentName = themeName;
      current = createThemePlayer({ ctx, destination, reverbBus }, getThemeVoicing(themeName), opts);
    },
    /**
     * Crossfades from the current theme to a new one. Starts playback if
     * nothing is playing yet; ignores a switch to the same theme.
     * @param {string} themeName - Theme name to switch to.
     */
    setTheme(themeName) {
      if (themeName === currentName) return;
      currentName = themeName;
      const previous = current;
      const next = createThemePlayer({ ctx, destination, reverbBus }, getThemeVoicing(themeName));
      next.master.gain.value = 0;
      next.master.gain.setTargetAtTime(1, ctx.currentTime, CROSSFADE / 3);
      current = next;
      if (previous) previous.stop(CROSSFADE);
    },
    /** Stops all music, fading out the current theme. */
    stop() {
      if (current) current.stop(CROSSFADE);
      current = null;
      currentName = null;
    },
    /**
     * @returns {boolean} Whether a theme is currently playing.
     */
    isRunning() {
      return current !== null;
    },
    /**
     * Snapshot of what is playing, for handing music state to the next
     * page. Phase is 0 when nothing is playing.
     * @returns {{theme: ?string, phase: number}} The current theme and morph phase.
     */
    getState() {
      return { theme: currentName, phase: current ? current.getPhase() : 0 };
    },
  };
}
