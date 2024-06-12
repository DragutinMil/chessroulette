import {
  ChessColor,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { Offer, PlayActions, PlayState } from './types';
import { GameType, chessGameTimeLimitMsMap } from '../types';

const setupNewGame = (
  gameType: GameType,
  color: ChessColor
): PlayState['game'] => {
  const timeLeft = chessGameTimeLimitMsMap[gameType];

  return {
    ...initialPlayState.game,
    orientation: color,
    status: 'pending',
    timeLeft: {
      white: timeLeft,
      black: timeLeft,
    },
  };
};

export const reducer = (
  prev: PlayState = initialPlayState,
  action: PlayActions
): PlayState => {
  if (action.type === 'play:move') {
    const { lastMoveAt, lastMoveBy, timeLeft, pgn } = prev.game;
    const { moveAt } = action.payload;
    const movedAtAsDate = new Date(moveAt);
    const lastMoveAtAsDate =
      prev.game.status === 'pending' ? movedAtAsDate : new Date(lastMoveAt);

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
      prev.game.status === 'pending' && pgn.length === 0
        ? 'ongoing'
        : (prev.gameType !== 'untimed' &&
            prev.game.status !== 'pending' &&
            (nextTimeLeft < 0 || isCheckMate)) ||
          (prev.gameType === 'untimed' &&
            prev.game.status === 'ongoing' &&
            isCheckMate)
        ? 'complete'
        : 'ongoing';
    const turn = toLongColor(swapColor(lastMoveBy));

    return {
      ...prev,
      game: {
        ...prev.game,
        pgn: instance.pgn(),
        timeLeft: {
          ...prev.game.timeLeft,
          [turn]: nextTimeLeft,
        },
        lastMoveBy: turn,
        lastMoveAt: moveAt,
        status: nextGameState,
        ...(isCheckMate && {
          winner: turn,
        }),
      },
    };
  }

  if (action.type === 'play:setGameType') {
    const timeLeft = chessGameTimeLimitMsMap[action.payload.gameType];
    return {
      ...prev,
      gameType: action.payload.gameType,
      game: {
        ...prev.game,
        timeLeft: {
          white: timeLeft,
          black: timeLeft,
        },
      },
    };
  }

  if (action.type === 'play:timeout') {
    if (prev.game.status !== 'ongoing') {
      return prev;
    }
    //clear any pending offer leftover
    const lastOffer =
      prev.offers.length > 0 &&
      (prev.offers[prev.offers.length - 1] as Offer).status === 'pending'
        ? ({
            ...prev.offers[prev.offers.length - 1],
            status: 'cancelled',
          } as Offer)
        : undefined;

    return {
      ...prev,
      game: {
        ...prev.game,
        status: 'complete',
        winner: prev.game.lastMoveBy,
        timeLeft: {
          ...prev.game.timeLeft,
          [swapColor(prev.game.lastMoveBy)]: 0,
        },
      },
      ...(lastOffer && {
        offers: [...prev.offers.slice(0, -1), lastOffer],
      }),
    };
  }

  if (action.type === 'play:resignGame') {
    return {
      ...prev,
      game: {
        ...prev.game,
        status: 'complete',
        winner: toLongColor(swapColor(action.payload.color)),
      },
    };
  }

  if (action.type === 'play:sendOffer') {
    const { byPlayer, offerType } = action.payload;
    const nextOffers: Offer[] = [
      ...prev.offers,
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
      offers: nextOffers,
    };
  }

  if (action.type === 'play:acceptOfferRematch') {
    const lastOffer: Offer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const game = setupNewGame(prev.gameType, swapColor(prev.game.orientation));

    return {
      ...prev,
      offers: [...prev.offers.slice(0, -1), lastOffer],
      game,
    };
  }

  if (action.type === 'play:acceptOfferDraw') {
    const lastOffer: Offer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    return {
      ...prev,
      offers: [...prev.offers.slice(0, -1), lastOffer],
      game: {
        ...prev.game,
        status: 'complete',
        winner: '1/2',
      },
    };
  }

  if (action.type === 'play:acceptTakeBack') {
    const lastOffer: Offer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const newGame = getNewChessGame({
      pgn: prev.game.pgn.slice(0, prev.game.pgn.length - 1),
    });

    const takebackAt =
      prev.offers[prev.offers.length - 1].timestamp || new Date().getTime();

    const elapsedTime = takebackAt - prev.game.lastMoveAt;
    const nextTimeLeft = prev.game.timeLeft[prev.game.lastMoveBy] - elapsedTime;
    const turn = toLongColor(swapColor(prev.game.lastMoveBy));

    return {
      ...prev,
      game: {
        ...prev.game,
        pgn: newGame.pgn(),
        lastMoveBy: turn,
        timeLeft: {
          ...prev.game.timeLeft,
          [prev.game.lastMoveBy]: nextTimeLeft,
        },
      },
      offers: [...prev.offers.slice(0, -1), lastOffer],
    };
  }

  if (action.type === 'play:denyOffer') {
    const lastOffer: Offer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'denied',
    };
    return {
      ...prev,
      offers: [...prev.offers.slice(0, -1), lastOffer],
    };
  }

  if (action.type === 'play:cancelOffer') {
    const lastOffer: Offer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'cancelled',
    };
    return {
      ...prev,
      offers: [...prev.offers.slice(0, -1), lastOffer],
    };
  }

  return prev;
};
