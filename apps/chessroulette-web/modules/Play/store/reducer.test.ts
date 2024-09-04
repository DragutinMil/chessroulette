import { Game, PlayActions, PlayState } from './types';
import { reducer as playReducer } from './reducer';
import { createGame } from './operations';

const wrapIntoPlay = <G extends Game>(game: G): PlayState => ({
  game,
});

describe('Game Status: Pending > Idling', () => {
  test('It advances to "idling" on calling "play:startWhitePlayerIdlingTimer"', () => {
    const action: PlayActions = {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    };

    const pendingGame = createGame({
      color: 'white',
      timeClass: 'blitz',
    });

    const actual = playReducer(wrapIntoPlay(pendingGame), action);

    const expected: PlayState = wrapIntoPlay({
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: pendingGame.timeLeft,
      pgn: '',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: null,
      lastMoveBy: 'black',
      winner: null,
      offers: [],
      orientation: 'white',
    });

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Idling', () => {
  test('It remains on "idling" on first White Move', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const idleAction: PlayActions = {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    };

    const pendingGame = createGame({
      color: 'white',
      timeClass: 'blitz',
    });

    const idle = playReducer(wrapIntoPlay(pendingGame), idleAction);
    const actual = playReducer(idle, action);

    const expected: PlayState = wrapIntoPlay({
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: pendingGame.timeLeft,
      pgn: '1. e4',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 123,
      lastMoveBy: 'white',
      winner: null,
      offers: [],
      orientation: 'white',
    });

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Aborted', () => {
  test('It moves from Idling to Aborted after timer ends', () => {
    const pendingGame = createGame({
      color: 'white',
      timeClass: 'blitz',
    });
    const idleAction: PlayActions = {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    };
    const action: PlayActions = {
      type: 'play:abortGame',
      payload: { color: 'white' },
    };

    const idle = playReducer(wrapIntoPlay(pendingGame), idleAction);
    const actual = playReducer(idle, action);

    const expected: PlayState = wrapIntoPlay({
      status: 'aborted',
      timeClass: pendingGame.timeClass,
      timeLeft: pendingGame.timeLeft,
      pgn: '',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: null,
      lastMoveBy: 'black',
      winner: null,
      offers: [],
      orientation: 'white',
    });

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Ongoing', () => {
  test('It Moves from "idling" to "ongoing" on first Black Move (once both players moved once)', () => {
    const pendingGame = createGame({
      color: 'white',
      timeClass: 'blitz',
    });

    const idleAction: PlayActions = {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    };

    const idle = playReducer(wrapIntoPlay(pendingGame), idleAction);

    const playAfterWhiteMove = playReducer(idle, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const actual = playReducer(playAfterWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 234 },
    });

    const expected: PlayState = wrapIntoPlay({
      status: 'ongoing',
      // No changes here
      timeClass: pendingGame.timeClass,
      timeLeft: pendingGame.timeLeft,
      pgn: '1. e4 e6',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 234,
      lastMoveBy: 'black',
      winner: null,
      offers: [],
      orientation: 'white',
    });

    expect(actual).toEqual(expected);
  });
});

describe('Ongoing > Ongoing', () => {});

describe('Game Status: Ongoing > Completed', () => {});
