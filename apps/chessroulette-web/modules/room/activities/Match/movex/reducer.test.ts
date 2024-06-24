import { createMatchState } from './operations';
import { reducer as matchReducer } from './reducer';
import { MatchActivityActions, MatchActivityState, MatchState } from './types';
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
    // expect(1).toBe(2);
  });
});

describe('Start New Match => ', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: 'maria',
    challengerId: 'john',
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  test('Swap players colors when starting new game if not the first of the series', () => {
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
          id: 'john',
        },
        black: {
          id: 'maria',
        },
      },
      ongoingPlay: wrapIntoPlay({
        ...createGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'ongoing',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
      }),
    };

    const newMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatch,
    };

    expect(actual).toEqual(newMatchState);

    const resignAction: PlayActions = {
      type: 'play:resignGame',
      payload: {
        color: 'white',
      },
    };

    const update = matchReducer(actual, resignAction);

    const startNewMatch: MatchActivityActions = {
      type: 'match:startNewGame',
    };

    const actualNewMatch = matchReducer(update, startNewMatch);

    const expectedMatchUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      completedPlays: [
        {
          ...wrapIntoPlay({
            ...createGame({
              timeClass: 'blitz',
              color: 'w',
            }),
            status: 'complete',
            pgn: '1. e4',
            lastMoveAt: 123,
            lastMoveBy: 'white',
            winner: 'black',
          }),
        },
      ],
      players: {
        white: {
          id: 'maria',
        },
        black: {
          id: 'john',
        },
      },
      ongoingPlay: {
        game: createGame({
          timeClass: 'blitz',
          color: 'black',
        }),
      },
    };

    const finalMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatchUpdate,
    };

    expect(actualNewMatch).toEqual(finalMatchState);
  });
});

describe('End Match when rounds number reached', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 1,
    timeClass: 'blitz',
    challengeeId: 'maria',
    challengerId: 'john',
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);

  test('ending last game should end the series', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(wrapIntoActivityState(pendingMatch), action);

    const expectedMatch: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 1,
      completedPlays: [],
      players: {
        white: {
          id: 'john',
        },
        black: {
          id: 'maria',
        },
      },
      ongoingPlay: wrapIntoPlay({
        ...createGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'ongoing',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
      }),
    };

    const newMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatch,
    };

    expect(actual).toEqual(newMatchState);

    const actionResign: PlayActions = {
      type: 'play:resignGame',
      payload: {
        color: 'black',
      },
    };

    const update = matchReducer(actual, actionResign);

    const expectedMatchUpdate: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 1,
      completedPlays: [],
      players: {
        white: {
          id: 'john',
        },
        black: {
          id: 'maria',
        },
      },
      ongoingPlay: {
        ...wrapIntoPlay({
          ...createGame({
            timeClass: 'blitz',
            color: 'w',
          }),
          status: 'complete',
          pgn: '1. e4',
          lastMoveAt: 123,
          lastMoveBy: 'white',
          winner: 'white',
        }),
      },
    };

    const finalMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatchUpdate,
    };

    expect(update).toEqual(finalMatchState);
  });

  test('draw game doesnt impact score', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(wrapIntoActivityState(pendingMatch), action);

    const expectedMatch: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 1,
      completedPlays: [],
      players: {
        white: {
          id: 'john',
        },
        black: {
          id: 'maria',
        },
      },
      ongoingPlay: wrapIntoPlay({
        ...createGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'ongoing',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
      }),
    };

    const newMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedMatch,
    };

    expect(actual).toEqual(newMatchState);

    const actionDrawInvite: PlayActions = {
      type: 'play:sendOffer',
      payload: {
        byPlayer: 'john',
        offerType: 'draw',
      },
    };

    const drawOffer = matchReducer(actual, actionDrawInvite);

    const acceptDraw: PlayActions = {
      type: 'play:acceptOfferDraw',
    };

    const update = matchReducer(drawOffer, acceptDraw);

    const expectedUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 1,
      completedPlays: [],
      players: {
        white: {
          id: 'john',
        },
        black: {
          id: 'maria',
        },
      },
      ongoingPlay: wrapIntoPlay({
        ...createGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        offers: [{ byPlayer: 'john', status: 'accepted', type: 'draw' }],
        status: 'complete',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        winner: '1/2',
      }),
    };

    const updateMatchState: MatchActivityState = {
      activityType: 'match',
      activityState: expectedUpdate,
    };

    expect(update).toEqual(updateMatchState);
  });
});

// it('works', () => {
//   const actual = matchReducer(initialMatchActivityState, { type: '' });

//   expect(2).toEqual(3);
// });
