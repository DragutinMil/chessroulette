import { ChessColor } from '@xmatter/util-kit';
import { GameTimeClass, chessGameTimeLimitMsMap } from '../types';
import { Game } from './types';
import { PENDING_UNTIMED_GAME } from './state';

export const createGame = ({
  timeClass,
  color,
}: {
  timeClass: GameTimeClass;
  color: ChessColor;
}): Game => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...PENDING_UNTIMED_GAME,
    timeClass,
    orientation: color,
    timeLeft: {
      white: timeLeft,
      black: timeLeft,
    },
  };
};
