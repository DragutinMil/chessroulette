import {
  CompletedGame,
  CreateOngoingGameParams,
  Game,
  GameOverReason,
  GameTimeClass,
  OngoingGame,
} from '@app/modules/Game';
import { createMatchState } from './operations/operations';
import { reducer as matchReducer } from './reducer';
import { MatchState } from './types';
import {
  // AbortedPlayState,
  // CompletedPlayState,
  // PlayState,
  // Game,
  // GameOverReason,
  PlayActions,
  createPendingGame,
} from '../Play/store';
import { ChessColor, toShortColor } from '@xmatter/util-kit';

type CreateOngoingGameParams = {
  timeClass: GameTimeClass;
  lastMoveAt: number;
  startedAt: number;
  players?: Game['players'];
  challengerColor: ChessColor;
  // challengerColor?: ShortChessColor;
};

const TEST_PLAYERS = {
  white: 'test-white',
  black: 'test-black',
};

const createOngoingGame = ({
  timeClass,
  challengerColor,
  lastMoveAt,
  startedAt,
  players = TEST_PLAYERS,
}: // challengerColor = toShortColor(color), // TODO: Does this need to be defaulted to?
CreateOngoingGameParams): OngoingGame => {
  const pendingGame = createPendingGame({ timeClass, challengerColor });

  return {
    ...pendingGame,
    status: 'ongoing',
    startedAt,
    timeLeft: {
      ...pendingGame.timeLeft,
      lastUpdatedAt: lastMoveAt,
    },
    lastMoveAt,
    challengerColor: toShortColor(challengerColor),

    players,
  };
};

// const =<M extends MatchState>(
//   match: M
// ): MatchActivityStat => ({
//   activityType: 'match',
//   activityState: match,
// });

const CONSTANTS = {
  challengeeId: 'challengee-user',
  challengerId: 'challenger-user',
};

const wrapIntoPlay = <G extends Game>(game: G): G => game;

test('match does NOT become "pending" if the game has NOT started yet', () => {});

describe('Match Status: Pending > Ongoing', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'b',
  };

  const pendingMatch = createMatchState(matchCreateParams);

  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'b',
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'gigi',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'costel',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengeeId, points: 0 },
        black: { id: CONSTANTS.challengerId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'b',
        }),
        status: 'idling',
        startedAt: 123,
        winner: null,
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        players: TEST_PLAYERS,
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
      endedGames: [],
      players: {
        white: { id: CONSTANTS.challengeeId, points: 0 },
        black: { id: CONSTANTS.challengerId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createOngoingGame({
          timeClass: 'blitz',
          challengerColor: 'b',
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
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'w',
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
        }),
        status: 'idling',

        pgn: '1. g4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
        players: TEST_PLAYERS,
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
      endedGames: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              challengerColor: 'w',
              lastMoveAt: 1234,
              startedAt: 123,
            }),
            status: 'complete',
            pgn: '1. g4 e6 2. f3 Qh4#',
            lastMoveBy: 'black',
            winner: 'black',
            gameOverReason: GameOverReason['checkmate'],
          }),
        },
      ],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 1,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 1 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 }, // TODO: Start adding the points here as well
      winner: CONSTANTS.challengeeId,
      gameInPlay: null,
    };

    expect(lastUpdate).toEqual(expectedUpdated);
  });
});

describe('Start New Match => ', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'w',
    },
  });

  test('Swap players colors when starting new game if not the first of the series', () => {
    const actualAfterFirstMove = matchReducer(idlingMatch, {
      type: 'play:move',
      payload: { from: 'e2', to: 'e4', moveAt: 123 },
    });

    const expectedAfterFirstMove: MatchState = {
      status: 'pending',
      type: 'bestOf',
      rounds: 3,
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
        players: TEST_PLAYERS,
      }),
    };

    expect(actualAfterFirstMove).toEqual(expectedAfterFirstMove);

    const matchAfterSecondMove = matchReducer(actualAfterFirstMove, {
      type: 'play:move',
      payload: { from: 'e7', to: 'e6', moveAt: 123 },
    });

    const actualAfterResignation = matchReducer(matchAfterSecondMove, {
      type: 'play:resignGame',
      payload: {
        color: 'white',
      },
    });

    const actual = matchReducer(actualAfterResignation, {
      type: 'match:startNewGame',
    });

    const expected: MatchState = {
      status: 'ongoing',
      type: 'bestOf',
      rounds: 3,
      endedGames: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              challengerColor: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'black',
            gameOverReason: GameOverReason['resignation'],
          }),
        },
      ],
      winner: null,
      // players: {
      //   white: {
      //     id: 'maria',
      //     points: 1,
      //   },
      //   black: {
      //     id: 'john',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengeeId, points: 1 },
        black: { id: CONSTANTS.challengerId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      gameInPlay: createPendingGame({
        timeClass: 'blitz',
        challengerColor: 'b',
      }),
    };

    expect(actual).toEqual(expected);
  });
});

describe('End Match when rounds number reached', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 1,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'w',
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 1 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
        players: TEST_PLAYERS,
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
      endedGames: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              challengerColor: 'w',
              startedAt: 123,
              lastMoveAt: 123,
            }),
            status: 'complete',
            pgn: '1. e4 e6',
            lastMoveBy: 'black',
            winner: 'white',
            gameOverReason: GameOverReason['resignation'],
          }),
        },
      ],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 1,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: {
          id: CONSTANTS.challengerId,
          points: 1,
        },
        black: {
          id: CONSTANTS.challengeeId,
          points: 0,
        },
      },
      challenger: { id: CONSTANTS.challengerId, points: 1 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: 'john',
      gameInPlay: null,
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
        }),
        status: 'idling',
        pgn: '1. e4',
        lastMoveAt: 123,
        lastMoveBy: 'white',
        startedAt: 123,
        winner: null,
        players: TEST_PLAYERS,
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
      endedGames: [
        {
          ...wrapIntoPlay({
            ...createOngoingGame({
              timeClass: 'blitz',
              challengerColor: 'w',
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
        },
      ],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: null,
    };

    expect(update).toEqual(expectedUpdate);
  });
});

describe('timer only starts after black moves', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'openEnded',
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'w',
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
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
        players: TEST_PLAYERS,
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
      endedGames: [],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createOngoingGame({
          timeClass: 'blitz',
          challengerColor: 'w',
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

    const { timeLeft } = final?.gameInPlay || {};

    expect(timeLeft?.black).toEqual(300000);
    expect(timeLeft?.white).not.toEqual(30000);
  });
});

describe('abort game -> match', () => {
  const matchCreateParams: Parameters<typeof createMatchState>[0] = {
    type: 'bestOf',
    rounds: 3,
    timeClass: 'blitz',
    challengeeId: CONSTANTS.challengeeId,
    challengerId: CONSTANTS.challengerId,
    startColor: 'w',
  };

  const pendingMatch = createMatchState(matchCreateParams);
  const idlingMatch = matchReducer(pendingMatch, {
    type: 'play:start',
    payload: {
      at: 123,
      challengerColor: 'w',
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
      endedGames: [
        wrapIntoPlay({
          ...createPendingGame({
            timeClass: 'blitz',
            challengerColor: 'w',
          }),
          offers: [],
          status: 'aborted',
          pgn: '',
          lastMoveAt: null,
          lastMoveBy: 'black',
          winner: null,
          startedAt: 123,
          players: TEST_PLAYERS,
        }),
      ],
      // players: {
      //   white: {
      //     id: 'john',
      //     points: 0,
      //   },
      //   black: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 0 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 0 },
      winner: null,
      gameInPlay: null,
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
      endedGames: [
        wrapIntoPlay({
          ...createOngoingGame({
            timeClass: 'blitz',
            challengerColor: 'w',
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
      ],
      // players: {
      //   black: {
      //     id: 'john',
      //     points: 1,
      //   },
      //   white: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 1 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'b',
        }),
      }),
    };

    expect(newMatch).toEqual(expectedNew);

    const idleMatch = matchReducer(newMatch, {
      type: 'play:start',
      payload: {
        at: 123,
        // TODO: Should this really be "black" - added after refactoring
        challengerColor: 'b',
      },
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
      endedGames: [
        wrapIntoPlay({
          ...createOngoingGame({
            timeClass: 'blitz',
            challengerColor: 'w',
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
        wrapIntoPlay({
          ...createPendingGame({
            timeClass: 'blitz',
            challengerColor: 'b',
          }),
          offers: [],
          status: 'aborted',
          pgn: '',
          lastMoveAt: null,
          lastMoveBy: 'black',
          winner: null,
          startedAt: 123,
          players: TEST_PLAYERS,
        }),
      ],
      // players: {
      //   black: {
      //     id: 'john',
      //     points: 1,
      //   },
      //   white: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 1 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      winner: 'john',
      gameInPlay: null,
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
      endedGames: [
        wrapIntoPlay({
          ...createOngoingGame({
            timeClass: 'blitz',
            challengerColor: 'w',
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
      ],
      // players: {
      //   black: {
      //     id: 'john',
      //     points: 1,
      //   },
      //   white: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 1 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      winner: null,
      gameInPlay: wrapIntoPlay({
        ...createPendingGame({
          timeClass: 'blitz',
          challengerColor: 'b',
        }),
      }),
    };

    expect(newMatch).toEqual(expectedNewMatch);

    const idleMatch = matchReducer(newMatch, {
      type: 'play:start',
      payload: { at: 123, challengerColor: 'b' },
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
      endedGames: [
        // {
        wrapIntoPlay({
          ...createOngoingGame({
            timeClass: 'blitz',
            challengerColor: 'w',
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
        // } as CompletedPlayState,

        wrapIntoPlay({
          ...createPendingGame({
            timeClass: 'blitz',
            challengerColor: 'b',
          }),
          offers: [],
          status: 'aborted',
          pgn: '1. e4',
          lastMoveAt: 123,
          lastMoveBy: 'white',
          winner: null,
          startedAt: 123,
          players: TEST_PLAYERS,
        }),
      ],
      // players: {
      //   black: {
      //     id: 'john',
      //     points: 1,
      //   },
      //   white: {
      //     id: 'maria',
      //     points: 0,
      //   },
      // },
      players: {
        white: { id: CONSTANTS.challengerId, points: 0 },
        black: { id: CONSTANTS.challengeeId, points: 1 },
      },
      challenger: { id: CONSTANTS.challengerId, points: 0 },
      challengee: { id: CONSTANTS.challengeeId, points: 1 },
      winner: 'maria',
      gameInPlay: null,
    };

    expect(actual).toEqual(expected);
  });
});
