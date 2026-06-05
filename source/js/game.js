/**
 * @file Game-screen bootstrap.
 *
 * Entry point for game.html. On DOMContentLoaded, initializes the render
 * pane and input pane, starts the game engine, and shows the end screen once
 * every tab has been typed to completion. Exposes a small handle on
 * window.__game for in-browser debugging.
 */

import {
  initRenderPane,
  renderPreview,
  refreshThemeColors,
} from "./renderPane.js";
import {
  initInputPane,
  reset as resetInputPane,
  getCurrentRoundData,
} from "./inputPane.js";
import {
  startGame,
  completeGame,
  resetGame,
  getGameState,
} from "./gameEngine.js";
import { showEndScreen } from "./endScreen.js";
import {
  initSettings,
  loadSettings,
  applySettings,
  resolveViewMode,
  SETTINGS_CHANGE_EVENT,
} from "./settings.js";
import { loadLevels, nextLevelId } from "./prompts.js";
import {
  setTimer,
  stopTimer,
  setCountdownTimer,
  pauseTimer,
  resumeTimer,
} from "./time.js";
import { recordLevelCompletion } from "./progress.js";
import { calculateRoundMetrics } from "./metrics.js";
import { initAudio, playMistake, playComplete, playStart } from "./audio.js";

window.addEventListener("DOMContentLoaded", async () => {
  initAudio();

  const previewFrame = initRenderPane(".render-pane");
  const gameContainer = document.querySelector(".game-container");
  const progressFill = document.querySelector(".progress-bar-fill");

  // The end screen is mounted as an overlay over the game and torn down on
  // restart, so the round can be replayed cleanly.
  let endOverlay = null;

  function clearEndScreen() {
    if (endOverlay) {
      endOverlay.remove();
      endOverlay = null;
    }
  }

  // The most recent string handed to the preview, kept so the iframe can be
  // re-rendered without new input (e.g. when the theme changes mid-round).
  let lastRender = null;

  // Builds the iframe document from the typed HTML/CSS: the CSS tab's text
  // becomes a <style> block and the HTML tab's text the body content.
  function renderTyped({ html, css, progress }) {
    lastRender = `<style>\n${css}\n</style>\n${html}`;
    renderPreview(previewFrame, lastRender);
    if (progressFill) {
      progressFill.style.width = `${progress.toFixed(1)}%`;
    }
  }

  // The preview iframe is a separate document, so it does not see the parent's
  // theme variables. Re-snapshot the palette and repaint the last-rendered
  // content whenever a setting changes (the theme attribute is already applied
  // by the time this fires), keeping `var(--brand-*)` in level CSS in sync —
  // including on the static end-screen "View Page" peek.
  document.addEventListener(SETTINGS_CHANGE_EVENT, () => {
    refreshThemeColors();
    if (lastRender !== null) {
      renderPreview(previewFrame, lastRender);
    }
  });

  // Once the typed tab(s) are complete, finish the round and show the metrics,
  // offering a Next Level link when one exists.
  function handleComplete({ targetText, typedText, mistakes }) {
    stopTimer();
    playComplete();
    completeGame();
    const { startTime, endTime } = getGameState();
    const metrics = calculateRoundMetrics({
      targetText,
      typedText,
      startTime,
      endTime,
      mistakes,
    });

    recordLevelCompletion(levelId, currentDifficulty, metrics);

    clearEndScreen();
    endOverlay = document.createElement("div");
    endOverlay.classList.add("end-screen-overlay");
    gameContainer.appendChild(endOverlay);

    showEndScreen(endOverlay, {
      endGame: "win",
      targetText,
      typedText,
      startTime,
      endTime,
      mistakes,
      nextLevelId: nextId,
    });
  }

  /**
   * When the countdown timer expires, ends the round as a loss and shows the
   * end screen with the player's performance up to that point. If a next level
   * exists, the player can click through to try it out immediately.
   */

  function handleTimeOut() {
    stopTimer();
    completeGame();
    const { startTime, endTime } = getGameState();

    const { targetText, typedText, mistakes } = getCurrentRoundData();
    clearEndScreen();
    endOverlay = document.createElement("div");
    endOverlay.classList.add("end-screen-overlay");
    gameContainer.appendChild(endOverlay);

    showEndScreen(endOverlay, {
      endGame: "lose",
      targetText,
      typedText,
      startTime,
      endTime,
      mistakes,
      nextLevelId: nextId,
    });
  }
  // Load the ordered level list for the player's chosen difficulty, then pick
  // the level named in ?level=<id> (or the first when absent/unknown). If
  // nothing loads (broken data, offline), prompts is undefined so the input
  // pane falls back to its built-in DEFAULT_PROMPTS and the round still plays.
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("level");
  const requestedDifficulty = params.get("difficulty") || "beginner";
  const levels = await loadLevels({ difficulty: requestedDifficulty });
  const current = levels.length
    ? (requestedId && levels.find((level) => level.id === requestedId)) ||
      levels[0]
    : null;

  // Pass the marker-bearing source so the Input Pane can build its snippet mask
  // for mobile view; it strips the `{{...}}` delimiters again for desktop display.
  const prompts = current
    ? { html: current.htmlMarked, css: current.cssMarked }
    : undefined;
  const mode = current ? current.mode : "html_then_css";
  const nextId = current ? nextLevelId(levels, current.id) : null;
  const levelId = current ? current.id : "Demo prompt";
  const countDown = current?.timeLimit || 60;
  const currentDifficulty = current?.difficulty;
  let countDownEnabled = loadSettings().countDownEnabled;

  // Mobile view runs the input pane in snippet mode (type only the {{...}}
  // tokens, scaffold auto-fills); desktop types the full prompt. The effective
  // mode is resolved once at load (device-detected when auto is on, else the
  // stored choice) and applied before paint so the layout matches; the game
  // page never live-switches because view mode can't change mid-level.
  const initialSettings = loadSettings();
  const effectiveViewMode = resolveViewMode(initialSettings, window);
  applySettings({ ...initialSettings, viewMode: effectiveViewMode });
  let snippetMode = effectiveViewMode === "mobile";

  function startInputPane() {
    initInputPane(".code-pane", prompts, renderTyped, handleComplete, mode, {
      snippetMode,
      onMistake: playMistake,
    });
  }

  startInputPane();
  startGame(levelId);
  if (countDownEnabled) {
    setCountdownTimer(".countdown-timer", countDown, handleTimeOut);
    document.querySelector(".timer").style.display = "none";
    document.querySelector(".countdown-timer").style.display = "block";
  } else {
    setTimer(".timer");
  }
  playStart();

  // Reset the engine to idle first so a finished or in-progress round can
  // legally transition back to active.
  function restart() {
    resetGame();
    stopTimer();
    if (countDownEnabled) {
      setCountdownTimer(".countdown-timer", countDown, handleTimeOut);
      document.querySelector(".timer").style.display = "none";
      document.querySelector(".countdown-timer").style.display = "block";
    } else {
      setTimer(".timer");
    }
    clearEndScreen();
    resetInputPane();
    startGame(levelId);
    if (progressFill) progressFill.style.width = "0%";
    playStart();
  }

  function handleCountDownChange(enabled) {
    countDownEnabled = enabled;
    resetGame();
    stopTimer();
    if (countDownEnabled) {
      setCountdownTimer(".countdown-timer", countDown, handleTimeOut);
      document.querySelector(".timer").style.display = "none";
      document.querySelector(".countdown-timer").style.display = "block";
    } else {
      setTimer(".timer");
      document.querySelector(".countdown-timer").style.display = "none";
      document.querySelector(".timer").style.display = "block";
    }
    clearEndScreen();
    startInputPane();
    startGame(levelId);
    if (progressFill) progressFill.style.width = "0%";
  }

  // Toggling the View setting switches the typing model. The two models track
  // progress differently (snippet tokens vs. full characters), so the round is
  // rebuilt from scratch rather than migrated — matching the agreed design.
  function handleViewModeChange(viewMode) {
    snippetMode = viewMode === "mobile";
    resetGame();
    stopTimer();
    if (countDownEnabled) {
      setCountdownTimer(".countdown-timer", countDown, handleTimeOut);
      document.querySelector(".timer").style.display = "none";
      document.querySelector(".countdown-timer").style.display = "block";
    } else {
      setTimer(".timer");
    }
    clearEndScreen();
    startInputPane();
    startGame(levelId);
    if (progressFill) progressFill.style.width = "0%";
    playStart();
  }

  const settings = initSettings({
    buttonSelector: ".settings-button",
    mountSelector: ".game-container",
    onRestart: restart,
    onViewModeChange: handleViewModeChange,
    onCountDownChange: handleCountDownChange,
    disableViewMode: true,
    onOpen: pauseTimer,
    onClose: resumeTimer,
  });

  window.__game = { getGameState, settings };
});
