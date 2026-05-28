/**
 * @file Timer utilities: elapsed timer and countdown timer for the game screen.
 */

let startTime;
let intervalId;
let countdownId;

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

  startTime = Date.now();
  intervalId = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
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

  clearInterval(countdownId);

  const endTime = Date.now() + duration * 1000;

  countdownId = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
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


