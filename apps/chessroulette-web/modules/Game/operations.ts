import { ChessColor } from '@xmatter/util-kit';
import { GameTimeClass, OngoingGame, PendingGame } from './types';
import { PENDING_UNTIMED_GAME } from './state';
import { chessGameTimeLimitMsMap } from './constants';

export const createPendingGame = ({
  timeClass,
  color,
}: {
  timeClass: GameTimeClass;
  color: ChessColor;
}): PendingGame => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    orientation: color,
    timeLeft: {
      lastUpdatedAt: null,
      white: timeLeft,
      black: timeLeft,
    },
  };
};

export const createOngoingGame = ({
  timeClass,
  color,
  lastMoveAt,
  startedAt,
}: {
  timeClass: GameTimeClass;
  color: ChessColor;
  lastMoveAt: number;
  startedAt: number;
}): OngoingGame => {
  const pendingGame = createPendingGame({ timeClass, color });

  return {
    ...pendingGame,
    status: 'ongoing',
    startedAt,
    timeLeft: {
      ...pendingGame.timeLeft,
      lastUpdatedAt: lastMoveAt,
    },
    lastMoveAt,
  };
};
