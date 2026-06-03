/**
 * @file Audio module.
 *
 * Synthesizes background music and gameplay sound effects entirely with
 * the Web Audio API, so the project ships no audio files and has no
 * copyright concerns. The module owns a single AudioContext that is
 * created lazily on the first user gesture (browsers block audio output
 * until then), and a master GainNode whose value is driven by the
 * persisted `audioEnabled` and `volume` settings.
 *
 * Background music is a slow ambient pad built from three detuned
 * oscillators feeding a low-pass filter, with a slow LFO on the master
 * gain for gentle motion. SFX are short, percussive envelopes generated
 * per call.
 *
 * The module listens for `cse110-settings-change` CustomEvents dispatched
 * by settings.js and reacts immediately to volume slider and audio
 * toggle changes.
 */

import { loadSettings } from './settings.js';

/**
 * Name of the CustomEvent dispatched by settings.js when any setting
 * changes. Kept in sync with the constant in settings.js.
 * @type {string}
 */
const SETTINGS_EVENT = 'cse110-settings-change';

/** @type {AudioContext | null} */
let ctx = null;
/** @type {GainNode | null} */
let masterGain = null;

/** Active BGM nodes, so they can be stopped on disable / volume-to-zero. */
let bgmNodes = null;
let bgmStarted = false;

/** Latest settings snapshot. Read on init and refreshed via the event. */
let settings = loadSettings();

/**
 * Effective gain target: 0 when audio is disabled, otherwise the volume
 * setting scaled into a comfortable range so the synthesized tones do
 * not clip at slider = 1.
 * @returns {number}
 */
function targetGain() {
  if (!settings.audioEnabled) return 0;
  return Math.max(0, Math.min(1, settings.volume)) * 0.4;
}

/**
 * Lazily creates the AudioContext and master gain. Returns null if the
 * browser has no Web Audio support.
 * @returns {AudioContext | null}
 */
function ensureContext() {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = targetGain();
  masterGain.connect(ctx.destination);
  return ctx;
}

/**
 * Smoothly retargets the master gain. Used on volume slider drag and on
 * audio enable/disable so changes are not clicky.
 */
function applyGain() {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setTargetAtTime(targetGain(), now, 0.05);
}

/**
 * Lo-fi arpeggio pattern over an Fmaj9 chord: F - A - C - E - G - E - C - A.
 * Rises to the 9th and falls back, giving a soft "river" shape that loops
 * without obvious seams. Frequencies are in Hz.
 * @readonly
 */
const ARPEGGIO = [
  174.61, // F3
  220.0, // A3
  261.63, // C4
  329.63, // E4
  392.0, // G4 (the 9th, adds the lo-fi colour)
  329.63, // E4
  261.63, // C4
  220.0, // A3
];

/** Seconds per arpeggio note. 0.35s ≈ eighth notes at 85 bpm. */
const NOTE_SECONDS = 0.35;

/** Sustained bass note under the arpeggio: F2 (an octave below the root). */
const BASS_FREQ = 87.31;

/**
 * Starts the looping background music: a triangle-wave Fmaj9 arpeggio
 * over a quiet sine bass, low-passed for a warm lo-fi pluck. Notes are
 * pre-scheduled on the audio clock via a look-ahead ticker so timing
 * doesn't drift with main-thread jitter. Idempotent: subsequent calls
 * are no-ops while BGM is already playing.
 */
function startBgm() {
  if (bgmStarted || !ctx || !masterGain) return;
  bgmStarted = true;

  const bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.6;
  bgmGain.connect(masterGain);

  // Low-pass keeps the triangle plucks warm rather than nasal.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.5;
  filter.connect(bgmGain);

  // Sustained bass voice under the arpeggio fills out the bottom.
  const bass = ctx.createOscillator();
  bass.type = 'sine';
  bass.frequency.value = BASS_FREQ;
  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.18;
  bass.connect(bassGain);
  bassGain.connect(filter);
  bass.start();

  // Schedule arpeggio notes ahead of the audio clock. Standard
  // look-ahead pattern: a setInterval ticks at ~20Hz and tops up any
  // note whose start falls within the next LOOKAHEAD window, so
  // scheduling stays ahead of playback even if the main thread blocks.
  const LOOKAHEAD = 0.2;
  let nextNoteTime = ctx.currentTime + 0.05;
  let step = 0;

  function scheduleNote(time, freq) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const env = ctx.createGain();
    // Short attack into a longer decay so notes ring into each other
    // without smearing — gives the loop a legato, music-box feel.
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.35, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    osc.connect(env);
    env.connect(filter);
    osc.start(time);
    osc.stop(time + 1.25);
  }

  function tick() {
    while (nextNoteTime < ctx.currentTime + LOOKAHEAD) {
      scheduleNote(nextNoteTime, ARPEGGIO[step % ARPEGGIO.length]);
      nextNoteTime += NOTE_SECONDS;
      step += 1;
    }
  }
  tick();
  const ticker = setInterval(tick, 50);

  bgmNodes = { bgmGain, filter, bass, bassGain, ticker };
}

/**
 * Stops the BGM and releases its nodes. Called on audio disable.
 */
function stopBgm() {
  if (!bgmStarted || !bgmNodes || !ctx) return;
  const { bgmGain, bass, ticker } = bgmNodes;
  // Stop scheduling new arpeggio notes immediately; in-flight notes
  // will tail off naturally via their own envelopes.
  clearInterval(ticker);
  const now = ctx.currentTime;
  // Quick fade so stopping doesn't pop.
  bgmGain.gain.cancelScheduledValues(now);
  bgmGain.gain.setTargetAtTime(0, now, 0.05);
  bass.stop(now + 0.3);
  bgmStarted = false;
  bgmNodes = null;
}

/**
 * Plays a short percussive envelope on the given oscillator config.
 * Used by every SFX helper.
 * @param {object} opts
 * @param {OscillatorType} opts.type
 * @param {number} opts.freq - Starting frequency in Hz.
 * @param {number} [opts.endFreq] - Frequency to glide to over the SFX duration.
 * @param {number} opts.duration - Total length in seconds.
 * @param {number} [opts.peak] - Peak gain (0..1) before scaling by master volume.
 */
function playEnvelope({ type, freq, endFreq, duration, peak = 0.5 }) {
  if (!ctx || !masterGain || !settings.audioEnabled) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 0.01), now + duration);
  }

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(peak, now + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(env);
  env.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/**
 * Resumes the AudioContext if a browser autoplay policy parked it in the
 * 'suspended' state. Must be called from within a user-gesture handler.
 */
function resumeIfNeeded() {
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Plays the short error blip for an incorrect keystroke.
 */
export function playMistake() {
  if (!ensureContext()) return;
  resumeIfNeeded();
  playEnvelope({ type: 'square', freq: 220, endFreq: 110, duration: 0.12, peak: 0.35 });
}

/**
 * Plays the round-complete success chime: two quick ascending tones.
 */
export function playComplete() {
  if (!ensureContext() || !ctx) return;
  resumeIfNeeded();
  playEnvelope({ type: 'triangle', freq: 523.25, duration: 0.18, peak: 0.45 });
  const second = ctx.currentTime + 0.16;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(659.25, second);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, second);
  env.gain.linearRampToValueAtTime(0.45, second + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, second + 0.35);
  osc.connect(env);
  env.connect(masterGain);
  osc.start(second);
  osc.stop(second + 0.4);
}

/**
 * Plays the soft start/restart cue.
 */
export function playStart() {
  if (!ensureContext()) return;
  resumeIfNeeded();
  playEnvelope({ type: 'sine', freq: 392, endFreq: 523.25, duration: 0.22, peak: 0.35 });
}

/**
 * Initializes audio for the page. Wires the document for a first-gesture
 * listener that creates the AudioContext and starts the BGM, and
 * subscribes to settings changes so the volume slider and audio toggle
 * take effect live.
 *
 * Safe to call from non-DOM contexts: when `document` is missing the
 * function is a no-op.
 */
export function initAudio() {
  if (typeof document === 'undefined') return;

  settings = loadSettings();

  // Browsers block AudioContext output until the user has interacted with
  // the page, so the first keystroke or click is what actually starts the
  // music. The listener is one-shot.
  const onFirstGesture = () => {
    if (!ensureContext()) return;
    resumeIfNeeded();
    if (settings.audioEnabled && settings.volume > 0) {
      startBgm();
    }
  };
  document.addEventListener('keydown', onFirstGesture, { once: true });
  document.addEventListener('pointerdown', onFirstGesture, { once: true });

  document.addEventListener(SETTINGS_EVENT, (event) => {
    const detail = event && event.detail;
    if (!detail || typeof detail !== 'object') return;
    settings = detail;
    applyGain();

    if (!ctx) return;
    const wantsBgm = settings.audioEnabled && settings.volume > 0;
    if (wantsBgm && !bgmStarted) {
      startBgm();
    } else if (!wantsBgm && bgmStarted) {
      stopBgm();
    }
  });
}
