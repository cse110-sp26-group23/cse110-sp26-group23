/**
 * @file Landing-screen bootstrap.
 *
 * Intended entry point for index.html, wiring the landing screen on
 * DOMContentLoaded. Currently a scaffold exporting a single greet helper
 * used to smoke-test the Jasmine runner.
 */

/**
 * Returns a friendly greeting for the given name.
 * @param {string} name - Name to greet
 * @returns {string} A greeting string
 */
export function greet(name) {
  return `Hello, ${name}!`;
}
