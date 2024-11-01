import { PlayActions } from './types';
import { reducer as playReducer } from './reducer';
// import { createPendingGame } from '../../Game/operations';
import { Game, createPendingGame } from '@app/modules/Game';

// const wrapIntoPlay = <G extends Game>(game: G): G => game;
const PLAYERS_BY_COLOR = {
  white: 'test-a',
  black: 'test-b',
};

const PLAYERS_BY_COLOR_REVERSED = {
  white: 'test-b',
  black: 'test-a',
};

describe('Game Status: Pending > Idling', () => {
  test('It advances to "idling" on calling "play:start"', () => {
    const action: PlayActions = {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    };

    const pendingGame = createPendingGame({
      // challengerColor: 'white',
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    const actual = playReducer(pendingGame, action);

    const expected: Game = {
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: null,
      },
      pgn: '',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: null,
      lastMoveBy: 'black',
      winner: null,
      offers: [],
      // orientation: 'white',
      gameOverReason: null,
      // challengerColor: 'w',
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Idling', () => {
  test('It remains on "idling" on first White Move', () => {
    // const action: PlayActions = ;

    // const idleAction: PlayActions = ;

    const pendingGame = createPendingGame({
      // challengerColor: 'white',
      players: PLAYERS_BY_COLOR_REVERSED,
      timeClass: 'blitz',
    });

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR_REVERSED },
    });
    const actual = playReducer(idle, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const expected: Game = {
      status: 'idling',
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: null,
      },
      pgn: '1. e4',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 123,
      lastMoveBy: 'white',
      winner: null,
      offers: [],
      // orientation: 'white',
      gameOverReason: null,
      // challengerColor: 'b',
      players: PLAYERS_BY_COLOR_REVERSED,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Aborted', () => {
  test('It moves from Idling to Aborted after timer ends', () => {
    const pendingGame = createPendingGame({
      // challengerColor: 'white',
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });
    // const idleAction: PlayActions = ;
    // const action: PlayActions = ;

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    });
    const actual = playReducer(idle, {
      type: 'play:abortGame',
      payload: { color: 'white' },
    });

    const expected: Game = {
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
      // orientation: 'white',
      gameOverReason: null,
      // challengerColor: 'b',
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Game Status: Idling > Ongoing', () => {
  test('It Moves from "idling" to "ongoing" on first Black Move (once both players moved once)', () => {
    const pendingGame = createPendingGame({
      // challengerColor: 'white',
      players: PLAYERS_BY_COLOR,
      timeClass: 'blitz',
    });

    // const idleAction: PlayActions = ;

    const idle = playReducer(pendingGame, {
      type: 'play:start',
      payload: { at: 123, players: PLAYERS_BY_COLOR },
    });

    const playAfterWhiteMove = playReducer(idle, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const actual = playReducer(playAfterWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 234 },
    });

    const expected: Game = {
      status: 'ongoing',
      // No changes here
      timeClass: pendingGame.timeClass,
      timeLeft: {
        ...pendingGame.timeLeft,
        lastUpdatedAt: 234,
      },
      pgn: '1. e4 e6',
      // these 2 are the same for now
      startedAt: 123,
      lastMoveAt: 234,
      lastMoveBy: 'black',
      winner: null,
      offers: [],
      // orientation: 'white',
      gameOverReason: null,
      // challengerColor: 'w',
      players: PLAYERS_BY_COLOR,
    };

    expect(actual).toEqual(expected);
  });
});

describe('Ongoing > Ongoing', () => {
  // TBD
});

describe('Game Status: Ongoing > Completed', () => {
  // TBD
});
