import {
  getNewChessGame,
  invoke,
  isOneOf,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { PlayActions, PlayState } from './types';
import { createPendingGame } from '../../Game/operations';
import { calculateTimeLeftAt, checkIsGameOverWithReason } from './util';
import { GameOffer, GameOverReason, GameStateWinner } from '@app/modules/Game';

// todo: left it here - what I need to do is create another game status where the players aren't yet given?
//  oor maybe they just aren't for pending game or idling!

export const reducer = (
  prev: PlayState = initialPlayState,
  action: PlayActions
): PlayState => {
  // This moves the game from pending to idling
  if (action.type === 'play:start') {
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
        challengerColor: action.payload.challengerColor,
      },
    };
  }

  if (action.type === 'play:move') {
    if (!(prev.game.status === 'idling' || prev.game.status === 'ongoing')) {
      // Cannot move otherwise
      return prev;
    }

    const { lastMoveBy, pgn } = prev.game;
    const { moveAt } = action.payload;

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
      challengerColor: prev.game.challengerColor,
    } as const;

    const commonNextGameProps = {
      pgn: instance.pgn(),
      lastMoveBy: turn,
      lastMoveAt: moveAt,
    } as const;

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
          gameOverReason: null,
        },
      };
    }

    const nextTimeLeft = calculateTimeLeftAt({
      at: moveAt,
      turn,
      prevTimeLeft: prev.game.timeLeft,
    });

    // Prev Game Status is "Ongoing"
    const isGameOverResult = checkIsGameOverWithReason(
      instance,
      prev.game.timeClass !== 'untimed' && nextTimeLeft[turn] < 0
    );

    if (isGameOverResult.ok) {
      const [gameOverReason, isDraw] = isGameOverResult.val;
      const nextWinner: GameStateWinner = invoke(() => {
        // There is no winner if the game is a draw!
        if (isDraw) {
          return '1/2';
        }

        return gameOverReason === GameOverReason['timeout']
          ? prev.game.lastMoveBy
          : turn;
      });

      // Next > "Complete"
      return {
        ...prev,
        game: {
          ...commonPrevGameProps,
          ...commonNextGameProps,
          startedAt: prev.game.startedAt,
          status: 'complete',
          winner: nextWinner,
          timeLeft: nextTimeLeft,
          gameOverReason,
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
        gameOverReason: null,
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

    // clear any pending offer leftover
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
          gameOverReason: GameOverReason['timeout'],
        },
        ...(lastOffer && {
          gameOffers: [...prev.game.offers.slice(0, -1), lastOffer],
        }),
      };
    }
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
        gameOverReason: GameOverReason['resignation'],
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
        gameOverReason: GameOverReason['acceptedDraw'],
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

  if (isOneOf(action.type, ['play:denyOffer', 'play:cancelOffer'])) {
    return {
      ...prev,
      game: {
        ...prev.game,
        // Remove the last offer
        // TODO: But in fact should be able to reset them because there can only be one offer at a time
        offers: prev.game.offers.slice(0, -1),
      },
    };
  }

  return prev;
};
