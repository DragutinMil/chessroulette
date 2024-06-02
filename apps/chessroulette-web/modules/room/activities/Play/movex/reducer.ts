import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import {
  ChessColor,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayActivityState } from './state';
import { Offer, PlayActivityState } from './types';
import { GameType, chessGameTimeLimitMsMap } from '../types';

const setupNewGame = (
  gameType: GameType,
  color: ChessColor
): PlayActivityState['activityState']['game'] => {
  const timeLeft = chessGameTimeLimitMsMap[gameType];
  return {
    ...initialPlayActivityState.activityState.game,
    orientation: color,
    state: 'pending',
    timeLeft: {
      white: timeLeft,
      black: timeLeft,
    },
  };
};

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'play') {
    return prev;
  }

  const prevActivityState = prev.activityState;

  if (action.type === 'play:move') {
    const { lastMoveAt, lastMoveBy, timeLeft, pgn } = prevActivityState.game;
    const { moveAt } = action.payload;
    const movedAtAsDate = new Date(moveAt);
    const lastMoveAtAsDate =
      prevActivityState.game.state === 'pending'
        ? movedAtAsDate
        : new Date(lastMoveAt);

    const instance = getNewChessGame({ pgn });
    const elapsedTime = movedAtAsDate.getTime() - lastMoveAtAsDate.getTime();
    const nextTimeLeft = timeLeft[lastMoveBy] - elapsedTime;

    try {
      instance.move(localChessMoveToChessLibraryMove(action.payload));
    } catch (e) {
      console.error(
        'Action Error:',
        action.type,
        'Move Invalid:',
        action.payload,
        prev,
        e
      );
      return prev;
    }

    const isCheckMate = instance.isCheckmate();

    const nextGameState =
      prevActivityState.game.state === 'pending' && pgn.length === 0
        ? 'ongoing'
        : (prevActivityState.gameType !== 'untimed' &&
            prevActivityState.game.state !== 'pending' &&
            (nextTimeLeft < 0 || isCheckMate)) ||
          (prevActivityState.gameType === 'untimed' &&
            prevActivityState.game.state === 'ongoing' &&
            isCheckMate)
        ? 'complete'
        : 'ongoing';
    const turn = toLongColor(swapColor(lastMoveBy));

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          pgn: instance.pgn(),
          timeLeft: {
            ...prev.activityState.game.timeLeft,
            [turn]: nextTimeLeft,
          },
          lastMoveBy: turn,
          lastMoveAt: moveAt,
          state: nextGameState,
          ...(isCheckMate && {
            winner: turn,
          }),
        },
      },
    };
  }

  if (action.type === 'play:setGameType') {
    const timeLeft = chessGameTimeLimitMsMap[action.payload.gameType];
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        gameType: action.payload.gameType,
        game: {
          ...prev.activityState.game,
          timeLeft: {
            white: timeLeft,
            black: timeLeft,
          },
        },
      },
    };
  }

  if (action.type === 'play:timeout') {
    if (prevActivityState.game.state !== 'ongoing') {
      return prev;
    }
    //clear any pending offer leftover
    const lastOffer =
      prevActivityState.offers.length > 0 &&
      (prevActivityState.offers[prevActivityState.offers.length - 1] as Offer)
        .status === 'pending'
        ? ({
            ...prevActivityState.offers[prevActivityState.offers.length - 1],
            status: 'cancelled',
          } as Offer)
        : undefined;

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          state: 'complete',
          winner: prev.activityState.game.lastMoveBy,
          timeLeft: {
            ...prev.activityState.game.timeLeft,
            [swapColor(prev.activityState.game.lastMoveBy)]: 0,
          },
        },
        ...(lastOffer && {
          offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
        }),
      },
    };
  }

  if (action.type === 'play:resignGame') {
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          state: 'complete',
          winner: toLongColor(swapColor(action.payload.color)),
        },
      },
    };
  }

  if (action.type === 'play:sendOffer') {
    const { byPlayer, offerType } = action.payload;
    const offers: Offer[] = [
      ...prevActivityState.offers,
      {
        byPlayer,
        offerType,
        status: 'pending',
        ...(action.payload.timestamp && {
          timestamp: action.payload.timestamp,
        }),
      },
    ];

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        offers,
      },
    };
  }

  if (action.type === 'play:acceptOfferRematch') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'accepted',
    };

    const game = setupNewGame(
      prevActivityState.gameType,
      swapColor(prev.activityState.game.orientation)
    );

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
        game,
      },
    };
  }

  if (action.type === 'play:acceptOfferDraw') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'accepted',
    };

    return {
      ...prev,
      activityState: {
        ...prevActivityState,
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
        game: {
          ...prevActivityState.game,
          state: 'complete',
          winner: '1/2',
        },
      },
    };
  }

  if (action.type === 'play:acceptTakeBack') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'accepted',
    };

    const pgn = prevActivityState.game.pgn.slice(
      0,
      prevActivityState.game.pgn.length - 1
    );

    const newGame = getNewChessGame({ pgn });

    const takebackAt =
      prevActivityState.offers[prevActivityState.offers.length - 1].timestamp ||
      new Date().getTime();

    const elapsedTime = takebackAt - prevActivityState.game.lastMoveAt;

    const nextTimeLeft =
      prevActivityState.game.timeLeft[prevActivityState.game.lastMoveBy] -
      elapsedTime;

    const turn = toLongColor(swapColor(prev.activityState.game.lastMoveBy));

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          pgn: newGame.pgn(),
          lastMoveBy: turn,
          timeLeft: {
            ...prev.activityState.game.timeLeft,
            [prev.activityState.game.lastMoveBy]: nextTimeLeft,
          },
        },
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
      },
    };
  }

  if (action.type === 'play:denyOffer') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'denied',
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
      },
    };
  }

  if (action.type === 'play:cancelOffer') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'cancelled',
    };
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
      },
    };
  }

  return prev;
};
