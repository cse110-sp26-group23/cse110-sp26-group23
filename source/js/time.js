let startTime;
let intervalId;

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
  }, 1000);
}

/**
 * Stops the timer on the specified DOM element
 * @returns {boolean} - True if the timer was stopped, false otherwise
 */

export function stopTimer() {
  clearInterval(intervalId);
  intervalId = null;
}
