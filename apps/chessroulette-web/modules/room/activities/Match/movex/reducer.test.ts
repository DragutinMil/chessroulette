import { createMatchState } from './operations';
import { reducer as matchReducer } from './reducer';
import { MatchActivityState, MatchState } from './types';
import {
  Game,
  PlayActions,
  PlayState,
  createGame,
} from 'apps/chessroulette-web/modules/Play/store';

const wrapIntoActivityState = <M extends MatchState>(
  match: M
): MatchActivityState => ({
  activityType: 'match',
  activityState: match,
});

const wrapIntoPlay = <G extends Game>(game: G): PlayState => ({
  game,
});

test('match does NOT become "pending" if the game has NOT started yet', () => {});

describe('Match Status: Pending > Ongoing', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: 'gigi',
    challengerId: 'costel',
    startColor: 'b',
  };

  const pendingMatch = createMatchState(matchCreateParams);

  test('With first move action', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(wrapIntoActivityState(pendingMatch), action);

    const expectedMatch: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      completedPlays: [],
      players: {
        white: {
          id: 'gigi',
        },
        black: {
          id: 'costel',
        },
      },
      ongoingPlay: wrapIntoPlay({
        ...createGame({
          timeClass: 'blitz',
          color: 'b',
        }),
        status: 'ongoing',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
      }),
    };

    const expected: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatch,
    };

    expect(actual).toEqual(expected);
  });

  // test('With first move action', () => {
  //   const action: PlayActions = {
  //     type: 'play:move',
  //     payload: { from: 'e2', to: 'e4', moveAt: 123 },
  //   };

  //   const actual = matchReducer(wrapIntoActivityState(pendingMatch), action);

  //   const expectedMatch: MatchState = {
  //     status: 'ongoing',
  //     type: 'bestOf',
  //     rounds: 3,
  //     completedPlays: [],
  //     players: {
  //       white: {
  //         id: 'gigi',
  //       },
  //       black: {
  //         id: 'costel',
  //       },
  //     },
  //     ongoingPlay: wrapIntoPlay({
  //       ...createGame({
  //         timeClass: 'blitz',
  //         color: 'b',
  //       }),
  //       status: 'ongoing',
  //       pgn: '1. e4',
  //       lastMoveAt: 123,
  //       lastMoveBy: 'white',
  //     }),
  //   };

  //   const expected: MatchActivityState = {
  //     activityType: 'match',
  //     activityState: expectedMatch,
  //   };

  //   expect(actual).toEqual(expected);
  // });
});

describe('Match Status: Ongoing > Completed', () => {
  test('On check mate move', () => {
    // TBD

    // TODO: Uncomment this and make it work

    // const action: PlayActions = {
    //   type: 'play:move',
    //   payload: { from: 'e2', to: 'e4', moveAt: 123 },
    // };

    // const actual = matchReducer(wrapIntoActivityState(pendingMatch), action);

    // const expectedMatch: MatchState = {
    //   status: 'ongoing',
    //   type: 'bestOf',
    //   rounds: 3,
    //   completedPlays: [],
    //   players: {
    //     white: {
    //       id: 'gigi',
    //     },
    //     black: {
    //       id: 'costel',
    //     },
    //   },
    //   ongoingPlay: wrapIntoPlay({
    //     ...createGame({
    //       timeClass: 'blitz',
    //       color: 'b',
    //     }),
    //     status: 'ongoing',
    //     pgn: '1. e4',
    //     lastMoveAt: 123,
    //     lastMoveBy: 'white',
    //   }),
    // };

    // const expected: MatchActivityState = {
    //   activityType: 'match',
    //   activityState: expectedMatch,
    // };

    // expect(actual).toEqual(expected);

    expect(1).toBe(2);
  });
});

// it('works', () => {
//   const actual = matchReducer(initialMatchActivityState, { type: '' });

//   expect(2).toEqual(3);
// });
