import { Game, GameOverReason } from '@app/modules/Game';
import { createMatchState } from './operations/operations';
import { reducer as matchReducer } from './reducer';
import { MatchState } from './types';
import {
  AbortedPlayState,
  CompletedPlayState,
  // Game,
  // GameOverReason,
  PlayActions,
  PlayState,
  createOngoingGame,
  createPendingGame,
} from '@app/modules/Play/movex';

// const =<M extends MatchState>(
//   match: M
// ): MatchActivityStat => ({
//   activityType: 'match',
//   activityState: match,
// });

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

  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });

  test('With first move action', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [],
      players: {
        white: {
          id: 'gigi',
          score: 0,
        },
        black: {
          id: 'costel',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'b',
        }),
        status: 'idling',
        startedAt: 123,
        winner: null,
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
      }),
    };

    expect(actual).toEqual(expected);

    const actionBlack: PlayActions = {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    };

    const update = matchReducer(actual, actionBlack);

    const expectedUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [],
      players: {
        white: {
          id: 'gigi',
          score: 0,
        },
        black: {
          id: 'costel',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createOngoingGame({
          timeClass: 'blitz',
          color: 'b',
          startedAt: 123,
          lastMoveAt: 123,
        }),
        status: 'ongoing',
        winner: null,
        pgn: '1. e4 e6',
        lastMoveBy: 'black',
      }),
    };

    expect(update).toEqual(expectedUpdate);
  });
});

describe('Match Status: Ongoing > Completed', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 1,
    timeClass: 'blitz',
    challengeeId: 'maria',
    challengerId: 'john',
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });

  test('On check mate move', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'g2', to: 'g4', moveAt: 123 },
    };
    const actual = matchReducer(idlingMatch, action);
    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'idling',

        pgn: '1. g4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      }),
    };

    expect(actual).toEqual(expected);

    const actionBlack: PlayActions = {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 1234 },
    };
    const actualUpdate = matchReducer(actual, actionBlack);

    const actionWhite: PlayActions = {
      type: 'play:move',
      payload: { from: 'f2', to: 'f3', moveAt: 1234 },
    };

    const actualUpdateAgain = matchReducer(actualUpdate, actionWhite);

    const killerAction: PlayActions = {
      type: 'play:move',
      payload: { from: 'd8', to: 'h4', moveAt: 1234 },
    };

    const lastUpdate = matchReducer(actualUpdateAgain, killerAction);

    const expectedUpdated: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              lastMoveAt: 1234,
              startedAt: 123,
            }),
            status: 'complete',
            pgn: '1. g4 e6 2. f3 Qh4#',
            lastMoveBy: 'black',
            winner: 'black',
            gameOverReason: GameOverReason['checkmate'],
          }),
        } as CompletedPlayState,
      ],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 1,
        },
      },
      winner: 'maria',
      ongoingPlay: null,
    };

    expect(lastUpdate).toEqual(expectedUpdated);
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
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });

  test('Swap players colors when starting new game if not the first of the series', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      }),
    };

    expect(actual).toEqual(expected);

    const actual2 = matchReducer(actual, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const update = matchReducer(actual2, {
      type: 'play:resignGame',
      payload: {
        color: 'white',
      },
    });

    const actualNewMatch = matchReducer(update, {
      type: 'match:startNewGame',
    });

    const expectedMatchUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'black',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
      ],
      winner: null,
      players: {
        white: {
          id: 'maria',
          score: 1,
        },
        black: {
          id: 'john',
          score: 0,
        },
      },
      ongoingPlay: {
        game: createPendingGame({
          timeClass: 'blitz',
          color: 'b',
        }),
      },
    };

    expect(actualNewMatch).toEqual(expectedMatchUpdate);
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
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });

  test('ending last game should end the series', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      }),
    };

    expect(actual).toEqual(expected);

    const actual2 = matchReducer(actual, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const update = matchReducer(actual2, {
      type: 'play:resignGame',
      payload: {
        color: 'black',
      },
    });

    const expectedMatchUpdate: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
      ],
      players: {
        white: {
          id: 'john',
          score: 1,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: 'john',
      ongoingPlay: null,
    };

    expect(update).toEqual(expectedMatchUpdate);
  });

  test('draw game doesnt impact score', () => {
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      }),
    };

    expect(actual).toEqual(expected);

    const actual2 = matchReducer(actual, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const actionDrawInvite: PlayActions = {
      type: 'play:sendOffer',
      payload: {
        byPlayer: 'john',
        offerType: 'draw',
      },
    };

    const drawOffer = matchReducer(actual2, actionDrawInvite);

    const acceptDraw: PlayActions = {
      type: 'play:acceptOfferDraw',
    };

    const update = matchReducer(drawOffer, acceptDraw);

    const expectedUpdate: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 1,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [{ byPlayer: 'john', status: 'accepted', type: 'draw' }],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: '1/2',
            gameOverReason: GameOverReason['acceptedDraw'],
          }),
        } as CompletedPlayState,
      ],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: null,
    };

    expect(update).toEqual(expectedUpdate);
  });
});

describe('timer only starts after black moves', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'openEnded',
    timeClass: 'blitz',
    challengeeId: 'maria',
    challengerId: 'john',
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });

  test('timer shouldnt start after white move, only after black', () => {
    const moveWhiteTime = new Date().getTime();
    const action: PlayActions = {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: moveWhiteTime },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      // TODO: This should still be "pending" with the new Ideas
      status: 'pending',
      type: 'openEnded',
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'w',
        }),
        timeLeft: {
          lastUpdatedAt: null,
          white: 300000,
          black: 300000,
        },
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: moveWhiteTime,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
      }),
    };

    expect(actual).toEqual(expected);

    const moveBlackTime = new Date().getTime();
    const action2: PlayActions = {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: moveBlackTime },
    };

    const update = matchReducer(actual, action2);

    const expectedUpdate: MatchState = {
      status: 'ongoing',
      type: 'openEnded',
      endedPlays: [],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createOngoingGame({
          timeClass: 'blitz',
          color: 'w',
          startedAt: 123,
          lastMoveAt: moveBlackTime,
        }),
        // timeLeft: { white: 300000, black: 300000 },
        status: 'ongoing',
        pgn: '1. e4 e6',
        // lastMoveAt: moveBlackTime,
        lastMoveBy: 'black',
        // startedAt: 123,
        winner: null,
      }),
    };

    expect(update).toEqual(expectedUpdate);

    const lastMoveTime = new Date().getTime() + 1;
    const lastMoveAction: PlayActions = {
      type: 'play:move',
      payload: { from: 'c2', to: 'c4', moveAt: lastMoveTime },
    };

    const final = matchReducer(update, lastMoveAction);

    const { timeLeft } = final?.ongoingPlay?.game || {};

    expect(timeLeft?.black).toEqual(300000);
    expect(timeLeft?.white).not.toEqual(30000);
  });
});

describe('abort game -> match', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: 'maria',
    challengerId: 'john',
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:startWhitePlayerIdlingTimer',
    payload: {
      at: 123,
    },
  });
  test('aborting first game will abort the whole match', () => {
    const action: PlayActions = {
      type: 'play:abortGame',
      payload: {
        color: 'white',
      },
    };

    const actual = matchReducer(idlingMatch, action);

    const expected: MatchState = {
      status: 'aborted',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createPendingGame({
              timeClass: 'blitz',
              color: 'w',
            }),
            offers: [],
            status: 'aborted',
            pgn: '',
            lastMoveAt: null,
            lastMoveBy: 'black',
            winner: null,
            startedAt: 123,
          }),
        } as AbortedPlayState,
      ],
      players: {
        white: {
          id: 'john',
          score: 0,
        },
        black: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: null,
    };

    expect(expected).toEqual(actual);
  });

  test('aborting second game will complete the match and have a winner - abort with white', () => {
    const matchUpdateWhiteMove = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const matchUpdateBlackMove = matchReducer(matchUpdateWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const matchUpdateResign = matchReducer(matchUpdateBlackMove, {
      type: 'play:resignGame',
      payload: {
        color: 'black',
      },
    });

    const newMatch = matchReducer(matchUpdateResign, {
      type: 'match:startNewGame',
    });

    const expectedNew: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
      ],
      players: {
        black: {
          id: 'john',
          score: 1,
        },
        white: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'b',
        }),
      }),
    };

    expect(newMatch).toEqual(expectedNew);

    const idleMatch = matchReducer(newMatch, {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    });

    const actual = matchReducer(idleMatch, {
      type: 'play:abortGame',
      payload: {
        color: 'white',
      },
    });

    const expected: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
        {
          ...wrapIntoPlay({
            ...createPendingGame({
              timeClass: 'blitz',
              color: 'b',
            }),
            offers: [],
            status: 'aborted',
            pgn: '',
            lastMoveAt: null,
            lastMoveBy: 'black',
            winner: null,
            startedAt: 123,
          }),
        } as AbortedPlayState,
      ],
      players: {
        black: {
          id: 'john',
          score: 1,
        },
        white: {
          id: 'maria',
          score: 0,
        },
      },
      winner: 'john',
      ongoingPlay: null,
    };

    expect(actual).toEqual(expected);
  });

  test('aborting second game will complete the match and have a winner - abort with black', () => {
    const matchUpdateWhiteMove = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });
    const matchUpdateBlackMove = matchReducer(matchUpdateWhiteMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });
    const matchUpdateResign = matchReducer(matchUpdateBlackMove, {
      type: 'play:resignGame',
      payload: {
        color: 'black',
      },
    });

    const newMatch = matchReducer(matchUpdateResign, {
      type: 'match:startNewGame',
    });

    const expectedNewMatch: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
      ],
      players: {
        black: {
          id: 'john',
          score: 1,
        },
        white: {
          id: 'maria',
          score: 0,
        },
      },
      winner: null,
      ongoingPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          color: 'b',
        }),
      }),
    };

    expect(newMatch).toEqual(expectedNewMatch);

    const idleMatch = matchReducer(newMatch, {
      type: 'play:startWhitePlayerIdlingTimer',
      payload: { at: 123 },
    });

    const moveWhite = matchReducer(idleMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const actual = matchReducer(moveWhite, {
      type: 'play:abortGame',
      payload: {
        color: 'black',
      },
    });

    const expected: MatchState = {
      status: 'complete',
      type: 'bestOf',
      rounds: 3,
      endedPlays: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              color: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            offers: [],
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        } as CompletedPlayState,
        {
          ...wrapIntoPlay({
            ...createPendingGame({
              timeClass: 'blitz',
              color: 'b',
            }),
            offers: [],
            status: 'aborted',
            pgn: '1. e4',
            lastMoveAt: 123,
            lastMoveBy: 'white',
            winner: null,
            startedAt: 123,
          }),
        } as AbortedPlayState,
      ],
      players: {
        black: {
          id: 'john',
          score: 1,
        },
        white: {
          id: 'maria',
          score: 0,
        },
      },
      winner: 'maria',
      ongoingPlay: null,
    };

    expect(actual).toEqual(expected);
  });
});
