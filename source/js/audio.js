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
 * Background music is delegated to the generative engine in
 * music-engine.js, which plays a per-theme voicing (music-themes.js) and
 * morphs it over time. This module hosts the engine on a dedicated
 * music-master gain that feeds the shared master gain, so volume and the
 * audio toggle keep working unchanged. SFX are short, percussive envelopes
 * generated per call.
 *
 * The module listens for `cse110-settings-change` CustomEvents dispatched
 * by settings.js and reacts immediately to volume slider, audio toggle,
 * and theme changes (the latter crossfades the music to the new theme).
 */

import { loadSettings } from './settings.js';
import { createMusicEngine } from './music-engine.js';

/**
 * Name of the CustomEvent dispatched by settings.js when any setting
 * changes. Kept in sync with the constant in settings.js.
 * @type {string}
 */
const SETTINGS_EVENT = 'cse110-settings-change';

/**
 * sessionStorage key carrying music state across a page navigation. The
 * app is multi-page (index.html ↔ game.html), so each navigation unloads
 * the AudioContext; we persist the theme and morph phase here so the next
 * page resumes the same theme and fades in instead of restarting with a
 * hard cut. sessionStorage is per-tab and survives same-tab navigations.
 * @type {string}
 */
const MUSIC_STATE_KEY = 'cse110-typing-game/music-state';

/** Seconds to fade music in when resuming after a page handoff. */
const HANDOFF_FADE = 1.2;

/** @type {AudioContext | null} */
let ctx = null;
/** @type {GainNode | null} */
let masterGain = null;

/** The generative music engine and the gain node it feeds, while BGM runs. */
let engine = null;
/** @type {GainNode | null} */
let musicMaster = null;
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
 * Reads and clears the music handoff state left by the previous page.
 * Consumed once so a stale phase never lingers if music is restarted
 * within the same page. Returns null when absent or unusable.
 * @returns {{phase: number} | null}
 */
function readMusicState() {
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return null;
    const raw = storage.getItem(MUSIC_STATE_KEY);
    storage.removeItem(MUSIC_STATE_KEY);
    if (!raw) return null;
    const phase = Number(JSON.parse(raw).phase);
    if (!Number.isFinite(phase) || phase < 0) return null;
    return { phase };
  } catch {
    return null;
  }
}

/**
 * Persists the current theme and morph phase so the next page can resume
 * them. No-op when music is not playing or storage is unavailable.
 */
function saveMusicState() {
  if (!engine || !bgmStarted) return;
  try {
    const storage = globalThis.sessionStorage;
    if (!storage) return;
    const { phase } = engine.getState();
    storage.setItem(MUSIC_STATE_KEY, JSON.stringify({ phase, theme: settings.theme }));
  } catch {
    // Storage may be unavailable (quota, private mode); the next page just
    // starts fresh.
  }
}

/**
 * Starts the generative background music for the current theme. Creates a
 * music-master gain feeding the shared master gain, spins up the engine,
 * and starts the active theme. When arriving from another page, resumes
 * the saved morph phase and fades in so the transition is seamless rather
 * than a hard cut. Idempotent: subsequent calls are no-ops while BGM is
 * already playing.
 */
function startBgm() {
  if (bgmStarted || !ctx || !masterGain) return;
  bgmStarted = true;

  musicMaster = ctx.createGain();
  musicMaster.gain.value = 1;
  musicMaster.connect(masterGain);

  engine = createMusicEngine({ ctx, destination: musicMaster });
  const handoff = readMusicState();
  engine.start(settings.theme, handoff ? { phase: handoff.phase, fadeIn: HANDOFF_FADE } : {});
}

/**
 * Stops the BGM, fading the engine out and releasing its music-master
 * node. Called on audio disable / volume-to-zero.
 */
function stopBgm() {
  if (!bgmStarted) return;
  if (engine) engine.stop();
  engine = null;

  // Disconnect the music-master after the engine's fade so the graph is
  // released; the engine fades its own voices, so no extra ramp is needed.
  const fading = musicMaster;
  musicMaster = null;
  if (fading) {
    setTimeout(() => {
      try { fading.disconnect(); } catch { /* already disconnected */ }
    }, 3500);
  }
  bgmStarted = false;
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
    const prevTheme = settings.theme;
    settings = detail;
    applyGain();

    if (!ctx) return;
    const wantsBgm = settings.audioEnabled && settings.volume > 0;
    if (wantsBgm && !bgmStarted) {
      startBgm();
    } else if (!wantsBgm && bgmStarted) {
      stopBgm();
    } else if (bgmStarted && engine && settings.theme !== prevTheme) {
      // Music is already playing and the user switched theme: crossfade.
      engine.setTheme(settings.theme);
    }
  });

  // Hand the music state to the next page just before this one unloads, so
  // navigating index.html ↔ game.html resumes the same theme and fades in.
  // `pagehide` is preferred over `beforeunload`: it is more reliable on
  // mobile and also fires when the page enters the back/forward cache.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', saveMusicState);
  }
}
