import {
  getNewChessGame,
  invoke,
  isOneOf,
  localChessMoveToChessLibraryMove,
  swapColor,
  toLongColor,
} from '@xmatter/util-kit';
import { initialPlayState } from './state';
import { PlayActions } from './types';
import { createPendingGame } from '../../../Game/operations';
import { calculateTimeLeftAt, checkIsGameOverWithReason } from './util';
import {
  Game,
  GameOffer,
  GameOverReason,
  GameStateWinner,
} from '@app/modules/Game';

// todo: left it here - what I need to do is create another game status where the players aren't yet given?
//  oor maybe they just aren't for pending game or idling!

export const reducer = (
  prev: Game = initialPlayState,
  action: PlayActions
): Game => {
  // This moves the game from pending to idling
  if (action.type === 'play:start') {
    // Only a "pending" game can start
    if (prev.status !== 'pending') {
      return prev;
    }

    // prev.challengerColor

    return {
      ...prev,
      status: 'idling',
      startedAt: action.payload.at,
      lastMoveAt: null,
      // challengerColor: action.payload.challengerColor,
      players: action.payload.players,
    };
  }

  if (action.type === 'play:move') {
    if (!(prev.status === 'idling' || prev.status === 'ongoing')) {
      // Cannot move otherwise
      return prev;
    }

    const { lastMoveBy, pgn } = prev;
    const { moveAt } = action.payload;

    const instance = getNewChessGame({ pgn });
    try {
      instance.move(localChessMoveToChessLibraryMove(action.payload));
    } catch (e) {
      console.error('Action Error:', {
        action,
        prevGame: prev,
        error: e,
      });
      return prev;
    }

    const turn = toLongColor(swapColor(lastMoveBy));

    const commonPrevGameProps = {
      timeClass: prev.timeClass,
      offers: prev.offers,
      orientation: prev.orientation,
      challengerColor: prev.challengerColor,
      players: prev.players,
    } as const;

    const commonNextGameProps = {
      pgn: instance.pgn(),
      lastMoveBy: turn,
      lastMoveAt: moveAt,
    } as const;

    if (prev.status === 'idling') {
      // The Game Status advances to "ongoing" only if both players moved
      const canAdvanceToOngoing = instance.moveNumber() >= 2;

      const nextStatus = canAdvanceToOngoing ? 'ongoing' : 'idling';

      if (nextStatus === 'idling') {
        // Next > "Idling"
        return {
          ...prev,
          ...commonNextGameProps,
        };
      }

      // Next > "Ongoing"
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        status: 'ongoing',
        // Copy this over from the "idling" state
        startedAt: prev.startedAt,
        // When moving from Idling to Ongoing (aka. on first black move), the timeLeft doesn't change
        timeLeft: {
          ...prev.timeLeft,
          lastUpdatedAt: moveAt,
        },
        winner: null,
        gameOverReason: null,
      };
    }

    const nextTimeLeft = calculateTimeLeftAt({
      at: moveAt,
      turn,
      prevTimeLeft: prev.timeLeft,
    });

    // Prev Game Status is "Ongoing"
    const isGameOverResult = checkIsGameOverWithReason(
      instance,
      prev.timeClass !== 'untimed' && nextTimeLeft[turn] < 0
    );

    if (isGameOverResult.ok) {
      const [gameOverReason, isDraw] = isGameOverResult.val;
      const nextWinner: GameStateWinner = invoke(() => {
        // There is no winner if the game is a draw!
        if (isDraw) {
          return '1/2';
        }

        return gameOverReason === GameOverReason['timeout']
          ? prev.lastMoveBy
          : turn;
      });

      // Next > "Complete"
      return {
        ...commonPrevGameProps,
        ...commonNextGameProps,
        startedAt: prev.startedAt,
        status: 'complete',
        winner: nextWinner,
        timeLeft: nextTimeLeft,
        gameOverReason,
      };
    }

    // Next > "Ongoing"
    return {
      ...commonPrevGameProps,
      ...commonNextGameProps,
      status: 'ongoing',
      startedAt: prev.startedAt,
      winner: null,
      timeLeft: nextTimeLeft,
      gameOverReason: null,
    };
  }

  if (action.type === 'play:abortGame') {
    if (prev.status === 'idling') {
      return {
        ...prev,
        status: 'aborted',
      };
    }

    return prev;
  }

  if (action.type === 'play:checkTime') {
    if (prev.status !== 'ongoing') {
      return prev;
    }

    // clear any pending offer leftover
    const lastOffer =
      prev.offers.length > 0 &&
      (prev.offers[prev.offers.length - 1] as GameOffer).status === 'pending'
        ? ({
            ...prev.offers[prev.offers.length - 1],
            status: 'cancelled',
          } as GameOffer)
        : undefined;

    const turn = toLongColor(swapColor(prev.lastMoveBy));

    const nextTimeLeft = calculateTimeLeftAt({
      // lastMoveAt: prev.game.lastMoveAt,
      at: action.payload.at,
      turn,
      prevTimeLeft: prev.timeLeft,
    });

    if (nextTimeLeft[turn] <= 0) {
      return {
        ...prev,
        status: 'complete',
        winner: prev.lastMoveBy,
        timeLeft: nextTimeLeft,
        gameOverReason: GameOverReason['timeout'],
        ...(lastOffer && {
          gameOffers: [...prev.offers.slice(0, -1), lastOffer],
        }),
      };
    }
  }

  if (action.type === 'play:resignGame') {
    // You can only resign an ongoing game!
    if (prev.status !== 'ongoing') {
      return prev;
    }

    return {
      ...prev,
      status: 'complete',
      winner: toLongColor(swapColor(action.payload.color)),
      gameOverReason: GameOverReason['resignation'],
    };
  }

  if (action.type === 'play:sendOffer') {
    const { byPlayer, offerType } = action.payload;
    const nextOffers: GameOffer[] = [
      ...prev.offers,
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
      offers: nextOffers,
    };
  }

  // TODO: This now needs to happen at MatchLevel
  // if (action.type === 'play:acceptOfferRematch') {
  //   // const lastOffer: GameOffer = {
  //   //   ...prev.game.offers[prev.game.offers.length - 1],
  //   //   status: 'accepted',
  //   // };

  //   const newGame = createPendingGame({
  //     timeClass: prev.timeClass,
  //     challengerColor: swapColor(prev.orientation),
  //   });

  //   return newGame;
  // }

  if (action.type === 'play:acceptOfferDraw') {
    // You can only offer a draw of an ongoing game
    if (prev.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      status: 'complete',
      winner: '1/2',
      offers: nextOffers,
      gameOverReason: GameOverReason['acceptedDraw'],
    };
  }

  if (action.type === 'play:acceptTakeBack') {
    // You can only accept take back of an ongoing game
    if (prev.status !== 'ongoing') {
      return prev;
    }

    const lastOffer: GameOffer = {
      ...prev.offers[prev.offers.length - 1],
      status: 'accepted',
    };

    const newGame = getNewChessGame({
      pgn: prev.pgn.slice(0, prev.pgn.length - 1),
    });

    const takebackAt =
      prev.offers[prev.offers.length - 1].timestamp || new Date().getTime();

    const elapsedTime = takebackAt - prev.lastMoveAt;
    const nextTimeLeft = prev.timeLeft[prev.lastMoveBy] - elapsedTime;

    const nextTurn = toLongColor(swapColor(prev.lastMoveBy));
    const nextOffers = [...prev.offers.slice(0, -1), lastOffer];

    return {
      ...prev,
      pgn: newGame.pgn(),
      lastMoveBy: nextTurn,
      timeLeft: {
        ...prev.timeLeft,
        [prev.lastMoveBy]: nextTimeLeft,
      },
      offers: nextOffers,
    };
  }

  if (isOneOf(action.type, ['play:denyOffer', 'play:cancelOffer'])) {
    return {
      ...prev,
      // Remove the last offer
      // TODO: But in fact should be able to reset them because there can only be one offer at a time
      offers: prev.offers.slice(0, -1),
    };
  }

  return prev;
};
