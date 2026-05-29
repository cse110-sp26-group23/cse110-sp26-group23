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
 * Starts the looping background music. Idempotent: subsequent calls are
 * no-ops while BGM is already playing.
 */
function startBgm() {
  if (bgmStarted || !ctx || !masterGain) return;
  bgmStarted = true;

  const bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.6;
  bgmGain.connect(masterGain);

  // Low-pass filter softens the oscillator stack into a pad.
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  filter.connect(bgmGain);

  // Three detuned sines a perfect fifth apart make a calm, chord-like drone.
  const freqs = [196.0, 261.63, 293.66];
  const oscs = freqs.map((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 6;
    osc.connect(filter);
    osc.start();
    return osc;
  });

  // Slow LFO on the pad gain so the drone breathes instead of sitting flat.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.18;
  lfo.connect(lfoGain);
  lfoGain.connect(bgmGain.gain);
  lfo.start();

  bgmNodes = { bgmGain, filter, oscs, lfo, lfoGain };
}

/**
 * Stops the BGM and releases its nodes. Called on audio disable.
 */
function stopBgm() {
  if (!bgmStarted || !bgmNodes || !ctx) return;
  const { bgmGain, oscs, lfo } = bgmNodes;
  const now = ctx.currentTime;
  // Quick fade so stopping doesn't pop.
  bgmGain.gain.cancelScheduledValues(now);
  bgmGain.gain.setTargetAtTime(0, now, 0.05);
  const stopAt = now + 0.3;
  oscs.forEach((osc) => osc.stop(stopAt));
  lfo.stop(stopAt);
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
