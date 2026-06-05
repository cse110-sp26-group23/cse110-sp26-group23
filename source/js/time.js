/**
 * @file Timer utilities: elapsed timer and countdown timer for the game screen.
 */

let startTime;
let intervalId;
let countdownId;
let timerElement;
let elapsedBeforePause = 0;
let countdownEndTime;
let countdownRemaining;
let countdownElement;
let countdownOnExpire;

/**
 * Sets up a timer on the specified DOM element
 * @param {string} element - The DOM element to display the timer
 */

export function setTimer(element) {
  const timeEl = document.querySelector(element);
  if (!timeEl) {
    console.error(`Element with selector "${element}" not found.`);
    return;
  }

  clearInterval(intervalId);
  clearInterval(countdownId);
  timerElement = element;
  elapsedBeforePause = 0;

  startTime = Date.now();
  intervalId = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime + elapsedBeforePause) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, 200);
}

/**
 * Stops the timer on the specified DOM element
 */

export function stopTimer() {
  clearInterval(intervalId);
  clearInterval(countdownId);
  intervalId = null;
  countdownId = null;
  elapsedBeforePause = 0;
  countdownRemaining = null;
}

/**
 * Pauses the active timer without resetting its displayed value.
 */
export function pauseTimer() {
  if (intervalId) {
    elapsedBeforePause += Date.now() - startTime;
    clearInterval(intervalId);
    intervalId = null;
  }

  if (countdownId) {
    countdownRemaining = Math.max(0, Math.ceil((countdownEndTime - Date.now()) / 1000));
    clearInterval(countdownId);
    countdownId = null;
  }
}

/**
 * Resumes the paused timer.
 */
export function resumeTimer() {
  if (countdownRemaining !== null && countdownElement) {
    setCountdownTimer(countdownElement, countdownRemaining, countdownOnExpire);
    countdownRemaining = null;
    return;
  }

  if (!intervalId && timerElement && elapsedBeforePause > 0) {
    const timeEl = document.querySelector(timerElement);
    if (!timeEl) return;

    startTime = Date.now();
    intervalId = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTime + elapsedBeforePause) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }, 200);
  }
}


/**
 * Sets up a countdown timer on the specified DOM element
 * @param {string} element - The DOM element to display the timer
 * @param {number} duration - The duration of the countdown in seconds
 * @param {Function} [onExpire] - Optional callback invoked when the countdown reaches zero
 */
export function setCountdownTimer(element, duration, onExpire) {
  const timeEl = document.querySelector(element);
  if (!timeEl) {
    console.error(`Element with selector "${element}" not found.`);
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  countdownElement = element;
  countdownOnExpire = onExpire;

  clearInterval(countdownId);

  countdownEndTime = Date.now() + duration * 1000;

  countdownId = setInterval(() => {
    const remaining = Math.ceil((countdownEndTime - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(countdownId);
      countdownId = null;
      timeEl.textContent = "0:00";
      if (onExpire) onExpire();
    } else {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 200);
}


