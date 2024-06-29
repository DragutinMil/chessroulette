import {
  getNewChessGame,
  invoke,
  isOneOf,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { GameOffer, PlayActions, PlayState } from './types';
import { createGame } from './operations';

export const reducer = (
  prev: PlayState = initialPlayState,
  action: PlayActions
): PlayState => {
  if (action.type === 'play:move') {
    if (!isOneOf(prev.game.status, ['pending', 'idling', 'ongoing'])) {
      // Cannot move otherwise
      return prev;
    }

    const { lastMoveBy, pgn } = prev.game;
    const { moveAt } = action.payload;

    // I took this out as it's not how ti works anymore with the new "idling" status
    // //if black hasn't moved yet, don't update the timeLeft
    // const nextTimeLeft = invoke(() => {
    //   if (movesHistory.totalMoves > 1 || lastMoveBy === 'black') {
    //     const movedAtAsDate = new Date(moveAt);
    //     const lastMoveAtAsDate =
    //       prev.game.status === 'pending'
    //         ? movedAtAsDate
    //         : new Date(lastMoveAt);

    //     const elapsedTime =
    //       movedAtAsDate.getTime() - lastMoveAtAsDate.getTime();
    //     return timeLeft[lastMoveBy] - elapsedTime;
    //   }
    //   return timeLeft[lastMoveBy];
    // });

    const instance = getNewChessGame({ pgn });
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

    const turn = toLongColor(swapColor(lastMoveBy));

    const commonPrevGameProps = {
      timeClass: prev.game.timeClass,
      offers: prev.game.offers,
      orientation: prev.game.orientation,
    } as const;

    const commonNextGameProps = {
      pgn: instance.pgn(),
      lastMoveBy: turn,
      lastMoveAt: moveAt,
    } as const;

    if (prev.game.status === 'pending') {
      // From Pending the Game advances to Idling (on Move)
      // Next > "Idling"
      return {
        ...prev,
        game: {
          ...commonPrevGameProps,
          ...commonNextGameProps,
          status: 'idling',
          // The StartedAt is the saame as the first move
          startedAt: action.payload.moveAt,
          winner: undefined,
          // The time left doesn't change yet
          timeLeft: prev.game.timeLeft,
        },
      };
    }

    const elapsedMsSinceLastMove =
      new Date(moveAt).getTime() - new Date(prev.game.lastMoveAt).getTime();
    const nextTimeLeftForTurn =
      prev.game.timeLeft[turn] - elapsedMsSinceLastMove;

    const nextTimeLeft = {
      ...prev.game.timeLeft,
      [turn]: nextTimeLeftForTurn,
    };

    if (prev.game.status === 'idling') {
      // The Game Status advances to "ongoing" only if both players moved
      const canAdvanceToOngoing = instance.moves().length >= 2;

      const nextStatus = canAdvanceToOngoing ? 'ongoing' : 'idling';

      if (nextStatus === 'idling') {
        // Next > "Idling"
        return {
          ...prev,
          game: {
            ...prev.game,
            ...commonNextGameProps,
          },
        };
      }

      // Next > "Ongoing"
      return {
        ...prev,
        game: {
          ...commonPrevGameProps,
          ...commonNextGameProps,
          status: 'ongoing',
          // Copy this over from the "idling" state
          startedAt: prev.game.startedAt,
          winner: undefined,
          timeLeft: nextTimeLeft,
        },
      };
    }

    // Prev Game Status is "Ongoing"

    const isCheckMate = instance.isCheckmate();
    const isTimeOut =
      prev.game.timeClass !== 'untimed' && nextTimeLeftForTurn < 0;

    const isGameComplete = isCheckMate || isTimeOut;

    if (isGameComplete) {
      const winner = invoke(() => {
        // If is timeout then the opponent won!
        if (isTimeOut) {
          return prev.game.lastMoveBy;
        }

        // Is Checkmate
        return turn;
      });

      // Next > "Complete"
      return {
        ...prev,
        game: {
          ...commonPrevGameProps,
          ...commonNextGameProps,
          startedAt: prev.game.startedAt,
          status: 'complete',
          winner,
          timeLeft: nextTimeLeft,
        },
      };
    }

    // Next > "Ongoing"
    return {
      ...prev,
      game: {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        status: 'ongoing',
        startedAt: prev.game.startedAt,
        winner: undefined,
        timeLeft: nextTimeLeft,
      },
    };
  }

  if (action.type === 'play:abortGame') {
    if (prev.game.status === 'idling') {
      return {
        ...prev,
        game: {
          ...prev.game,
          status: 'aborted',
        },
      };
    }

    return prev;
  }

  // TODO: @andrei Is this needed anywhere??
  // if (action.type === 'play:setGameTimeClass') {
  //   const timeLeft = chessGameTimeLimitMsMap[action.payload];

  //   return {
  //     ...prev,
  //     game: {
  //       ...prev.game,
  //       timeClass: action.payload,
  //       timeLeft: {
  //         white: timeLeft,
  //         black: timeLeft,
  //       },
  //     },
  //   };
  // }

  if (action.type === 'play:timeout') {
    if (prev.game.status !== 'ongoing') {
      return prev;
    }

    //clear any pending offer leftover
    const lastOffer =
      prev.game.offers.length > 0 &&
      (prev.game.offers[prev.game.offers.length - 1] as GameOffer).status ===
        'pending'
        ? ({
            ...prev.game.offers[prev.game.offers.length - 1],
            status: 'cancelled',
          } as GameOffer)
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
        gameOffers: [...prev.game.offers.slice(0, -1), lastOffer],
      }),
    };
  }

  if (action.type === 'play:resignGame') {
    // You can only resign an ongoing game!
    if (prev.game.status !== 'ongoing') {
      return prev;
    }

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
    const nextOffers: GameOffer[] = [
      ...prev.game.offers,
      {
        byPlayer,
        type: offerType,
        status: 'pending',
        ...(action.payload.timestamp && {
          timestamp: action.payload.timestamp,
        }),
      },
    ];

    return {
      ...prev,
      game: {
        ...prev.game,
        offers: nextOffers,
      },
    };
  }

  if (action.type === 'play:acceptOfferRematch') {
    // const lastOffer: GameOffer = {
    //   ...prev.game.offers[prev.game.offers.length - 1],
    //   status: 'accepted',
    // };

    const newGame = createGame({
      timeClass: prev.game.timeClass,
      color: swapColor(prev.game.orientation),
    });

    return {
      ...prev,
      // gameOffers: [...prev.gameOffers.slice(0, -1), lastOffer],
      game: newGame,
    };
  }

  if (action.type === 'play:acceptOfferDraw') {
    // You can only offer a draw of an ongoing game
    if (prev.game.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.game.offers[prev.game.offers.length - 1],
      status: 'accepted',
    };

    const nextOffers = [...prev.game.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      game: {
        ...prev.game,
        status: 'complete',
        winner: '1/2',
        offers: nextOffers,
      },
    };
  }

  if (action.type === 'play:acceptTakeBack') {
    // You can only accept take back of an ongoing game
    if (prev.game.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.game.offers[prev.game.offers.length - 1],
      status: 'accepted',
    };

    const newGame = getNewChessGame({
      pgn: prev.game.pgn.slice(0, prev.game.pgn.length - 1),
    });

    const takebackAt =
      prev.game.offers[prev.game.offers.length - 1].timestamp ||
      new Date().getTime();

    const elapsedTime = takebackAt - prev.game.lastMoveAt;
    const nextTimeLeft = prev.game.timeLeft[prev.game.lastMoveBy] - elapsedTime;
    const turn = toLongColor(swapColor(prev.game.lastMoveBy));

    const nextOffers = [...prev.game.offers.slice(0, -1), lastOffer];

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
        offers: nextOffers,
      },
    };
  }

  if (action.type === 'play:denyOffer') {
    // You can only accept take back of an ongoing game
    if (prev.game.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.game.offers[prev.game.offers.length - 1],
      status: 'denied',
    };

    const nextOffers = [...prev.game.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      game: {
        ...prev.game,
        offers: nextOffers,
      },
    };
  }

  if (action.type === 'play:cancelOffer') {
    const lastOffer: GameOffer = {
      ...prev.game.offers[prev.game.offers.length - 1],
      status: 'cancelled',
    };

    const nextOffers = [...prev.game.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      game: {
        ...prev.game,
        offers: nextOffers,
      },
    };
  }

  return prev;
};
