import { ChessColor, ShortChessColor, toShortColor } from '@xmatter/util-kit';
import { GameTimeClass, OngoingGame, PendingGame } from './types';
import { PENDING_UNTIMED_GAME } from './state';
import { chessGameTimeLimitMsMap } from './constants';

export type CreatePendingGameParams = {
  timeClass: GameTimeClass;
  challengerColor: ChessColor;
};

export const createPendingGame = ({
  timeClass,
  challengerColor,
}: CreatePendingGameParams): PendingGame => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    orientation: challengerColor,
    challengerColor: toShortColor(challengerColor),
    timeLeft: {
      lastUpdatedAt: null,
      white: timeLeft,
      black: timeLeft,
    },
  };
};

export type CreateOngoingGameParams = {
  timeClass: GameTimeClass;
  lastMoveAt: number;
  startedAt: number;
  challengerColor: ChessColor;
  // challengerColor?: ShortChessColor;
};

export const createOngoingGame = ({
  timeClass,
  challengerColor,
  lastMoveAt,
  startedAt,
  // challengerColor = toShortColor(color), // TODO: Does this need to be defaulted to?
}: CreateOngoingGameParams): OngoingGame => {
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
    // challengerColor,
  };
};
