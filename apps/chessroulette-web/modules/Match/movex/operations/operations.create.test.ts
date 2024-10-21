import {
  PlayState,
  initialPlayState,
} from '@app/modules/Play/movex';
import { createMatchState } from './operations';
import { MatchState } from '../types';
import { chessGameTimeLimitMsMap } from '@app/modules/Game/constants';

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

    const expectedPlay = {
      game: {
        ...initialPlayState.game,
        timeClass: 'blitz',
        orientation: 'b',
        timeLeft: {
          lastUpdatedAt: initialPlayState.game.lastMoveAt,
          black: chessGameTimeLimitMsMap.blitz,
          white: chessGameTimeLimitMsMap.blitz,
        },
      },
    } as PlayState;

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      players: {
        white: {
          id: CONSTANTS.challengeeId,
          score: 0,
        },
        black: {
          id: CONSTANTS.challengerId,
          score: 0,
        },
      },
      winner: null,
      endedPlays: [],
      ongoingPlay: expectedPlay,
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

    const expectedPlay: PlayState = {
      game: {
        ...initialPlayState.game,
        timeClass: 'bullet',
        orientation: 'w',
        timeLeft: {
          lastUpdatedAt: initialPlayState.game.lastMoveAt,
          black: chessGameTimeLimitMsMap.bullet,
          white: chessGameTimeLimitMsMap.bullet,
        },
      },
    } as PlayState;

    const expected: MatchState = {
      status: 'pending',
      type: 'openEnded',
      players: {
        white: {
          id: CONSTANTS.challengerId,
          score: 0,
        },
        black: {
          id: CONSTANTS.challengeeId,
          score: 0,
        },
      },
      winner: null,
      endedPlays: [],
      ongoingPlay: expectedPlay,
    };

    expect(actual).toEqual(expected);
  });
});
