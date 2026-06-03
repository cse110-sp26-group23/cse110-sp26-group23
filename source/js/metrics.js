
/**
 * Gets the number of seconds between the start and end time.
 * @param {number} startTime - Start time in milliseconds.
 * @param {number} endTime - End time in milliseconds.
 * @returns {number} Elapsed time in seconds.
 */
export function calculateElapsedTime(startTime, endTime) {
  if (typeof startTime !== 'number' || typeof endTime !== 'number') {
    throw new Error('calculateElapsedTime expects numeric start and end times.');
  }

  if (endTime < startTime) {
    throw new Error('End time cannot be before start time.');
  }

  return (endTime - startTime) / 1000;
}

/**
 * Counts character mistakes between the prompt and what the user typed.
 * Extra characters and missing characters count as mistakes too.
 * @param {string} targetText - The text the user should type.
 * @param {string} typedText - The text the user actually typed.
 * @returns {number} Number of mistakes.
 */
export function calculateErrorCount(targetText, typedText) {
  if (typeof targetText !== 'string' || typeof typedText !== 'string') {
    throw new Error('calculateErrorCount expects string inputs.');
  }

  const maxLength = Math.max(targetText.length, typedText.length);
  let errors = 0;

  for (let i = 0; i < maxLength; i += 1) {
    if (targetText[i] !== typedText[i]) {
      errors += 1;
    }
  }

  return errors;
}

/**
 * Calculates typing accuracy as a percent using tracked mistakes.
 * @param {number} targetLength - The total length of the expected text.
 * @param {number} mistakes - The total number of mistakes made during typing.
 * @returns {number} Accuracy percentage.
 */
export function calculateAccuracy(targetLength, mistakes) {
  if (typeof targetLength !== 'number' || typeof mistakes !== 'number') {
    throw new Error('calculateAccuracy expects numeric inputs.');
  }

  if (targetLength === 0) return 100;

  // Prevent negative accuracy if they somehow made more mistakes than there are characters
  const correctCharacters = Math.max(targetLength - mistakes, 0);
  const accuracy = (correctCharacters / targetLength) * 100;

  return Number(accuracy.toFixed(2));
}

/**
 * Calculates words per minute.
 * Standard typing estimate: 5 characters = 1 word.
 * @param {string} typedText - The text the user typed.
 * @param {number} elapsedSeconds - Time spent typing in seconds.
 * @returns {number} Words per minute.
 */
export function calculateWPM(typedText, elapsedSeconds) {
  if (typeof typedText !== 'string') {
    throw new Error('calculateWPM expects typedText to be a string.');
  }

  if (typeof elapsedSeconds !== 'number') {
    throw new Error('calculateWPM expects elapsedSeconds to be a number.');
  }

  if (elapsedSeconds <= 0) {
    return 0;
  }

  const wordsTyped = typedText.length / 5;
  const elapsedMinutes = elapsedSeconds / 60;
  const wpm = wordsTyped / elapsedMinutes;

  return Number(wpm.toFixed(2));
}

/**
 * Calculates all round metrics in one place.
 * @param {object} roundData - Data from the completed round.
 * @param {string} roundData.targetText - The expected prompt.
 * @param {string} roundData.typedText - The user's typed input.
 * @param {number} roundData.startTime - Start time in milliseconds.
 * @param {number} roundData.endTime - End time in milliseconds.
 * @returns {object} Round metrics.
 */
export function calculateRoundMetrics({
  targetText,
  typedText,
  startTime,
  endTime,
  mistakes,
}) {
  const elapsedSeconds = calculateElapsedTime(startTime, endTime);

  return {
    wpm: calculateWPM(typedText, elapsedSeconds),
    accuracy: calculateAccuracy(targetText.length, mistakes),
    errorCount: mistakes,
    elapsedSeconds,
  };
}