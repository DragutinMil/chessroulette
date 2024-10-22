import { ChessColor, ShortChessColor } from '@xmatter/util-kit';
import { GameTimeClass, OngoingGame, PendingGame } from './types';
import { PENDING_UNTIMED_GAME } from './state';
import { chessGameTimeLimitMsMap } from './constants';

export type CreatePendingGameParams = {
  timeClass: GameTimeClass;
  color: ChessColor;
};

export const createPendingGame = ({
  timeClass,
  color,
}: CreatePendingGameParams): PendingGame => {
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

export type CreateOngoingGameParams = {
  timeClass: GameTimeClass;
  color: ChessColor;
  lastMoveAt: number;
  startedAt: number;
  challengerColor?: ShortChessColor;
};

export const createOngoingGame = ({
  timeClass,
  color,
  lastMoveAt,
  startedAt,
  challengerColor = 'w', // TODO: Does this need to be defaulted to?
}: CreateOngoingGameParams): OngoingGame => {
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
    challengerColor,
  };
};
