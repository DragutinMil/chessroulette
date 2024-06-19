import {
  PlayState,
  initialPlayState,
} from 'apps/chessroulette-web/modules/Play/store';
import { createMatchState } from './operations';
import { MatchState } from './types';
import { chessGameTimeLimitMsMap } from 'apps/chessroulette-web/modules/Play/types';

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

    const expectedPlay: PlayState = {
      game: {
        ...initialPlayState.game,
        timeClass: 'blitz',
        orientation: 'b',
        timeLeft: {
          black: chessGameTimeLimitMsMap.blitz,
          white: chessGameTimeLimitMsMap.blitz,
        },
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      players: {
        white: {
          id: CONSTANTS.challengeeId,
        },
        black: {
          id: CONSTANTS.challengerId,
        },
      },
      completedPlays: [],
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
          black: chessGameTimeLimitMsMap.bullet,
          white: chessGameTimeLimitMsMap.bullet,
        },
      },
    };

    const expected: MatchState = {
      status: 'pending',
      type: 'openEnded',
      players: {
        white: {
          id: CONSTANTS.challengerId,
        },
        black: {
          id: CONSTANTS.challengeeId,
        },
      },
      completedPlays: [],
      ongoingPlay: expectedPlay,
    };

    expect(actual).toEqual(expected);
  });
});