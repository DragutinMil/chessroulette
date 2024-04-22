import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import {
  getNewChessGame,
  swapColor,
  toOtherLongChessColor,
} from '@xmatter/util-kit';
import { initialPlayActivityState } from './state';
import { chessGameTimeLimitMsMap } from '../components/Countdown/types';
import { Offer } from './types';
import { generateUserId } from 'apps/chessroulette-web/util';

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'play') {
    return prev;
  }

  const prevActivityState = prev.activityState;

  if (action.type === 'play:move') {
    const instance = getNewChessGame({ pgn: prevActivityState.game.pgn });
    const { lastMoveAt, lastMoveBy, timeLeft, pgn } = prevActivityState.game;
    const { moveAt } = action.payload;
    const movedAtAsDate = new Date(moveAt);
    const lastMoveAtAsDate =
      prevActivityState.game.state === 'pending'
        ? movedAtAsDate
        : new Date(lastMoveAt);

    const elapsedTime = movedAtAsDate.getTime() - lastMoveAtAsDate.getTime();
    const nextTimeLeft = timeLeft[lastMoveBy] - elapsedTime;

    try {
      instance.move(action.payload);
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
    const turn = toOtherLongChessColor(lastMoveBy);

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

  if (action.type === 'play:startNewGame') {
    const timeLeft = chessGameTimeLimitMsMap[action.payload.gameType];
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        gameType: action.payload.gameType,
        game: {
          ...initialPlayActivityState.activityState.game,
          orientation: swapColor(prev.activityState.game.orientation),
          state: 'pending',
          timeLeft: {
            white: timeLeft,
            black: timeLeft,
          },
        },
      },
    };
  }

  if (action.type === 'play:setGameComplete') {
    const { result } = action.payload;

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          state: 'complete',
          // TODO - result = 'mate' is dealt with in "move" action as it happens after a move. Maybe improve logic here and have 1 point of truth
          winner:
            result === 'timeout' || result === 'resign'
              ? prev.activityState.game.lastMoveBy
              : '1/2',
        },
      },
    };
  }

  if (action.type === 'play:sendOffer') {
    const { byParticipant, offerType } = action.payload;
    const offers: Offer[] = [
      ...prevActivityState.offers,
      {
        byParticipant,
        id: generateUserId(), // TODO -maybe use different random generator
        offerType,
        status: 'pending',
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

  if (action.type === 'play:acceptOffer') {
    const lastOffer: Offer = {
      ...prevActivityState.offers[prevActivityState.offers.length - 1],
      status: 'accepted',
    };
    console.log('new offers => ', [
      ...prevActivityState.offers.slice(0, -1),
      lastOffer,
    ]);
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        offers: [...prevActivityState.offers.slice(0, -1), lastOffer],
        ...(lastOffer.offerType === 'rematch' && {
          game: {
            ...prev.activityState.game,
            orientation: swapColor(prev.activityState.game.orientation),
            state: 'pending',
            timeLeft: {
              white: chessGameTimeLimitMsMap[prevActivityState.gameType],
              black: chessGameTimeLimitMsMap[prevActivityState.gameType],
            },
          },
        }),
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

  return prev;
};
