import {
  GameStates,
  getState,
  setState,
  resetGame,
  getGameState,
  updateGameState,
  startGame,
  pauseGame,
  resumeGame,
  completeGame,
} from '../js/gameEngine.js';

describe('gameEngine state management', () => {
  beforeEach(() => {
    resetGame();
  });

  test('starts in the idle state', () => {
    expect(getState()).toBe(GameStates.IDLE);
  });

  test('returns a copy of the full game state', () => {
    const state = getGameState();

    expect(state.status).toBe(GameStates.IDLE);
    expect(state.currentPrompt).toBe('');
    expect(state.typedInput).toBe('');
    expect(state.score).toBe(0);
    expect(state.mistakes).toBe(0);
  });

  test('allows transition from idle to active', () => {
    setState(GameStates.ACTIVE);

    expect(getState()).toBe(GameStates.ACTIVE);
  });

  test('allows transition from active to paused', () => {
    setState(GameStates.ACTIVE);
    setState(GameStates.PAUSED);

    expect(getState()).toBe(GameStates.PAUSED);
  });

  test('allows transition from paused back to active', () => {
    setState(GameStates.ACTIVE);
    setState(GameStates.PAUSED);
    setState(GameStates.ACTIVE);

    expect(getState()).toBe(GameStates.ACTIVE);
  });

  test('allows transition from active to complete', () => {
    setState(GameStates.ACTIVE);
    setState(GameStates.COMPLETE);

    expect(getState()).toBe(GameStates.COMPLETE);
  });

  test('allows transition from complete back to idle', () => {
    setState(GameStates.ACTIVE);
    setState(GameStates.COMPLETE);
    setState(GameStates.IDLE);

    expect(getState()).toBe(GameStates.IDLE);
  });

  test('throws error for an unknown game state', () => {
    expect(() => {
      setState('fake-state');
    }).toThrow('Unknown game state');
  });

  test('throws error for an illegal transition', () => {
    expect(() => {
      setState(GameStates.COMPLETE);
    }).toThrow('Illegal transition');
  });

  test('updateGameState updates non-status fields only', () => {
    updateGameState({
      status: GameStates.COMPLETE,
      score: 100,
      mistakes: 2,
      typedInput: '<h1>',
    });

    const state = getGameState();

    expect(state.status).toBe(GameStates.IDLE);
    expect(state.score).toBe(100);
    expect(state.mistakes).toBe(2);
    expect(state.typedInput).toBe('<h1>');
  });

  test('startGame moves game to active and initializes round data', () => {
    startGame('<h1>Hello</h1>');

    const state = getGameState();

    expect(state.status).toBe(GameStates.ACTIVE);
    expect(state.currentPrompt).toBe('<h1>Hello</h1>');
    expect(state.typedInput).toBe('');
    expect(state.score).toBe(0);
    expect(state.mistakes).toBe(0);
    expect(state.startTime).not.toBeNull();
    expect(state.endTime).toBeNull();
  });

  test('pauseGame moves active game to paused', () => {
    startGame('prompt');
    pauseGame();

    expect(getState()).toBe(GameStates.PAUSED);
  });

  test('resumeGame moves paused game back to active', () => {
    startGame('prompt');
    pauseGame();
    resumeGame();

    expect(getState()).toBe(GameStates.ACTIVE);
  });

  test('completeGame moves active game to complete and records end time', () => {
    startGame('prompt');
    completeGame();

    const state = getGameState();

    expect(state.status).toBe(GameStates.COMPLETE);
    expect(state.endTime).not.toBeNull();
  });

  test('resetGame returns the game to the initial idle state', () => {
    startGame('prompt');
    updateGameState({
      score: 50,
      mistakes: 3,
      typedInput: 'abc',
    });

    resetGame();

    const state = getGameState();

    expect(state.status).toBe(GameStates.IDLE);
    expect(state.currentPrompt).toBe('');
    expect(state.typedInput).toBe('');
    expect(state.score).toBe(0);
    expect(state.mistakes).toBe(0);
    expect(state.startTime).toBeNull();
    expect(state.endTime).toBeNull();
  });
});