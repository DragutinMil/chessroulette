import {
  getNewChessGame,
  invoke,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { GameOffer, PlayActions, PlayState } from './types';
import { createPendingGame } from './operations';
import { calculateTimeLeftAt } from './util';

export const reducer = (
  prev: PlayState = initialPlayState,
  action: PlayActions
): PlayState => {
  // console.log('play reducer', JSON.stringify({ action, prev }, null, 2));

  // This moves the game from pending to idling
  if (action.type === 'play:startWhitePlayerIdlingTimer') {
    // Only a "pending" game can start
    if (prev.game.status !== 'pending') {
      return prev;
    }

    return {
      ...prev,
      game: {
        ...prev.game,
        status: 'idling',
        startedAt: action.payload.at,
        lastMoveAt: null,
      },
    };
  }

  if (action.type === 'play:move') {
    if (
      !(
        // prev.game.status === 'pending' ||
        (prev.game.status === 'idling' || prev.game.status === 'ongoing')
      )
    ) {
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
      console.error('Action Error:', {
        action,
        prevGame: prev.game,
        error: e,
      });
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

    // if (prev.game.status === 'pending') {
    //   // From Pending the Game advances to Idling (on Move)
    //   // Next > "Idling"
    //   return {
    //     ...prev,
    //     game: {
    //       ...commonPrevGameProps,
    //       ...commonNextGameProps,
    //       status: 'idling',
    //       // The StartedAt is the saame as the first move
    //       startedAt: action.payload.moveAt,
    //       winner: undefined,
    //       // The time left doesn't change yet
    //       timeLeft: prev.game.timeLeft,
    //     },
    //   };
    // }

    if (prev.game.status === 'idling') {
      // The Game Status advances to "ongoing" only if both players moved
      const canAdvanceToOngoing = instance.moveNumber() >= 2;

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
          // When moving from Idling to Ongoing (aka. on first black move), the timeLeft doesn't change
          timeLeft: {
            ...prev.game.timeLeft,
            lastUpdatedAt: moveAt,
          },
          winner: null,
        },
      };
    }

    // console.group('--In Play Reducer');
    const nextTimeLeft = calculateTimeLeftAt({
      // lastMoveAt: prev.game.lastMoveAt,
      at: moveAt,
      turn,
      prevTimeLeft: prev.game.timeLeft,
    });
    // console.groupEnd();

    // Prev Game Status is "Ongoing"

    const isCheckMate = instance.isCheckmate();
    const isTimeOut =
      prev.game.timeClass !== 'untimed' && nextTimeLeft[turn] < 0;

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
        winner: null,
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

  if (action.type === 'play:checkTime') {
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

    const turn = toLongColor(swapColor(prev.game.lastMoveBy));

    const nextTimeLeft = calculateTimeLeftAt({
      // lastMoveAt: prev.game.lastMoveAt,
      at: action.payload.at,
      turn,
      prevTimeLeft: prev.game.timeLeft,
    });

    if (nextTimeLeft[turn] <= 0) {
      return {
        ...prev,
        game: {
          ...prev.game,
          status: 'complete',
          winner: prev.game.lastMoveBy,
          timeLeft: nextTimeLeft,
        },
        ...(lastOffer && {
          gameOffers: [...prev.game.offers.slice(0, -1), lastOffer],
        }),
      };
    }
  }

  // if (action.type === 'play:timeout') {
  //   if (prev.game.status !== 'ongoing') {
  //     return prev;
  //   }

  //   //clear any pending offer leftover
  //   const lastOffer =
  //     prev.game.offers.length > 0 &&
  //     (prev.game.offers[prev.game.offers.length - 1] as GameOffer).status ===
  //       'pending'
  //       ? ({
  //           ...prev.game.offers[prev.game.offers.length - 1],
  //           status: 'cancelled',
  //         } as GameOffer)
  //       : undefined;

  //   return {
  //     ...prev,
  //     game: {
  //       ...prev.game,
  //       status: 'complete',
  //       winner: toLongColor(swapColor(action.payload.color)),
  //       timeLeft: {
  //         ...prev.game.timeLeft,
  //         [swapColor(prev.game.lastMoveBy)]: 0,
  //       },
  //     },
  //     ...(lastOffer && {
  //       gameOffers: [...prev.game.offers.slice(0, -1), lastOffer],
  //     }),
  //   };
  // }

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

    const newGame = createPendingGame({
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
