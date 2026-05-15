/**
 * Game Engine — minimal game loop.
 *
 * Owns the global game state and the rules for moving between states.
 * Other modules (input pane, render pane, metrics) read and drive state
 * through {@link getState} and {@link setState}.
 */

/**
 * Enumeration of all valid game states.
 * @readonly
 * @enum {string}
 */
export const GameStates = Object.freeze({
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETE: 'complete',
});

/**
 * Legal transitions between states. A transition `from -> to` is allowed
 * only if `to` appears in `LEGAL_TRANSITIONS[from]`.
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
const LEGAL_TRANSITIONS = Object.freeze({
  [GameStates.IDLE]:     [GameStates.ACTIVE],
  [GameStates.ACTIVE]:   [GameStates.PAUSED, GameStates.COMPLETE],
  [GameStates.PAUSED]:   [GameStates.ACTIVE, GameStates.COMPLETE],
  [GameStates.COMPLETE]: [GameStates.IDLE],
});

let currentState = GameStates.IDLE;

/**
 * Get the current game state.
 * @returns {string} One of {@link GameStates}.
 */
export function getState() {
  return currentState;
}

/**
 * Switch to a new game state.
 *
 * Throws if `next` is not a known state or if the transition from the
 * current state to `next` is not allowed.
 *
 * @param {string} next - Target state; must be a value from {@link GameStates}.
 * @throws {Error} If `next` is unknown or the transition is illegal.
 */
export function setState(next) {
  if (!Object.values(GameStates).includes(next)) {
    throw new Error(`Unknown game state: ${next}`);
  }
  const allowed = LEGAL_TRANSITIONS[currentState];
  if (!allowed.includes(next)) {
    throw new Error(`Illegal transition: ${currentState} -> ${next}`);
  }
  currentState = next;
}

/**
 * Reset the engine to {@link GameStates.IDLE}. Intended for tests and
 * for returning to the landing screen after a finished game.
 */
export function resetState() {
  currentState = GameStates.IDLE;
}
