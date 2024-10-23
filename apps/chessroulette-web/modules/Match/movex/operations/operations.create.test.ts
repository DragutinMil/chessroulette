// import { PlayState, initialPlayState } from '@app/modules/Play/movex';
import { createMatchState } from './operations';
import { MatchState } from '../types';
import { chessGameTimeLimitMsMap } from '@app/modules/Game/constants';
import { initialPlayState } from '../../Play/store';
import { Game } from '@app/modules/Game';

const CONSTANTS = {
  challengeeId: 'challengee-user',
  challengerId: 'challenger-user',
};

describe('Best Of', () => {
  test('with given rounds and color', () => {
    const actual = createMatchState({
      type: 'bestOf',
      rounds: 3,
      timeClass: 'blitz',
      challengeeId: CONSTANTS.challengeeId,
      challengerId: CONSTANTS.challengerId,
      startColor: 'b',
    });

    const expectedGameInPlay: Game = {
      ...initialPlayState,
      timeClass: 'blitz',
      orientation: 'b',
      challengerColor: 'b',
      timeLeft: {
        lastUpdatedAt: initialPlayState.lastMoveAt,
        black: chessGameTimeLimitMsMap.blitz,
        white: chessGameTimeLimitMsMap.blitz,
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      players: {
        white: {
          id: CONSTANTS.challengeeId,
          points: 0,
        },
        black: {
          id: CONSTANTS.challengerId,
          points: 0,
        },
      },
      winner: null,
      endedGames: [],
      gameInPlay: expectedGameInPlay,
      challengee: {
        points: 0,
        id: CONSTANTS.challengeeId,
      },
      challenger: {
        points: 0,
        id: CONSTANTS.challengerId,
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe('Open Ended', () => {
  test('with given rounds and color', () => {
    const actual = createMatchState({
      type: 'openEnded',
      timeClass: 'bullet',
      challengeeId: CONSTANTS.challengeeId,
      challengerId: CONSTANTS.challengerId,
      startColor: 'w',
    });

    const expectedGameInPlay: Game = {
      ...initialPlayState,
      timeClass: 'bullet',
      orientation: 'w',
      timeLeft: {
        lastUpdatedAt: initialPlayState.lastMoveAt,
        black: chessGameTimeLimitMsMap.bullet,
        white: chessGameTimeLimitMsMap.bullet,
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'openEnded',
      players: {
        white: {
          id: CONSTANTS.challengerId,
          points: 0,
        },
        black: {
          id: CONSTANTS.challengeeId,
          points: 0,
        },
      },
      winner: null,
      endedGames: [],
      gameInPlay: expectedGameInPlay,
      challengee: {
        points: 0,
        id: CONSTANTS.challengeeId,
      },
      challenger: {
        points: 0,
        id: CONSTANTS.challengerId,
      },
    };

    expect(actual).toEqual(expected);
  });
});
