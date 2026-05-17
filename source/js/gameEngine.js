/**
 *
 * This module owns the global game state and validates movement between
 * game states. Other modules should use the exported functions instead of
 * directly changing state.
 */

/**
 * Enumeration of all valid game states
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
 * Legal transitions between game states
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
const LEGAL_TRANSITIONS = Object.freeze({
  [GameStates.IDLE]: [GameStates.ACTIVE],
  [GameStates.ACTIVE]: [GameStates.PAUSED, GameStates.COMPLETE],
  [GameStates.PAUSED]: [GameStates.ACTIVE, GameStates.COMPLETE],
  [GameStates.COMPLETE]: [GameStates.IDLE],
});

/**
 * Initial global game state
 */
const INITIAL_GAME_STATE = Object.freeze({
  status: GameStates.IDLE,
  currentPrompt: '',
  typedInput: '',
  score: 0,
  mistakes: 0,
  startTime: null,
  endTime: null,
});

/**
 * Mutable global game state
 */
let gameState = { ...INITIAL_GAME_STATE };

/**
 * Returns a copy of the full global game state
 * @returns {object} Current game state snapshot
 */
export function getGameState() {
  return { ...gameState };
}

/**
 * Returns only the current game status
 * @returns {string} One of GameStates
 */
export function getState() {
  return gameState.status;
}

/**
 * Checks whether a transition is legal
 * @param {string} from - Current state
 * @param {string} to - Target state
 * @returns {boolean} True if transition is legal
 */
export function canTransition(from, to) {
  return Boolean(LEGAL_TRANSITIONS[from]?.includes(to));
}

/**
 * Switches to a new game state if the transition is legal
 * @param {string} next - Target game state
 * @throws {Error} If the state is unknown or transition is illegal
 */
export function setState(next) {
  if (!Object.values(GameStates).includes(next)) {
    throw new Error(`Unknown game state: ${next}`);
  }

  if (!canTransition(gameState.status, next)) {
    throw new Error(`Illegal transition: ${gameState.status} -> ${next}`);
  }

  gameState = {
    ...gameState,
    status: next,
  };
}

/**
 * Updates non-status game state fields
 * Use setState() for changing the status field
 * @param {object} updates - Partial game state update
 */
export function updateGameState(updates) {
  const { status, ...safeUpdates } = updates;

  gameState = {
    ...gameState,
    ...safeUpdates,
  };
}

/**
 * Starts a new game
 * @param {string} prompt - Prompt text for the current round
 */
export function startGame(prompt = '') {
  setState(GameStates.ACTIVE);

  gameState = {
    ...gameState,
    currentPrompt: prompt,
    typedInput: '',
    score: 0,
    mistakes: 0,
    startTime: Date.now(),
    endTime: null,
  };
}

/**
 * Pauses the current game
 */
export function pauseGame() {
  setState(GameStates.PAUSED);
}

/**
 * Resumes a paused game
 */
export function resumeGame() {
  setState(GameStates.ACTIVE);
}

/**
 * Completes the current game
 */
export function completeGame() {
  setState(GameStates.COMPLETE);

  gameState = {
    ...gameState,
    endTime: Date.now(),
  };
}

/**
 * Resets the game back to the initial idle state
 */
export function resetGame() {
  gameState = { ...INITIAL_GAME_STATE };
}