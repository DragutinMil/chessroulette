import { GamePlayers, GameTimeClass, PendingGame } from './types';
import { PENDING_UNTIMED_GAME } from './state';
import { chessGameTimeLimitMsMap } from './constants';

export type CreatePendingGameParams = {
  timeClass: GameTimeClass;
  players: GamePlayers;
};

export const createPendingGame = ({
  timeClass,
  players,
}: CreatePendingGameParams): PendingGame => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    // orientation: challengerColor,
    orientation: 'w', // TODO: Remove the orientation
    challengerColor: 'w', // TODO: Remove the challengerColor

    timeLeft: {
      lastUpdatedAt: null,
      white: timeLeft,
      black: timeLeft,
    },
    players,
  };
};
