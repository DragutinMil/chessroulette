import { ChessColor } from '@xmatter/util-kit';
import { GameTimeClass, chessGameTimeLimitMsMap } from '../types';
import { Game } from './types';
import { initialPlayState } from './state';

export const createGame = ({
  timeClass,
  color,
}: {
  timeClass: GameTimeClass;
  color: ChessColor;
}): Game => {
  const timeLeft = chessGameTimeLimitMsMap[timeClass];

  return {
    ...initialPlayState.game,
    timeClass,
    orientation: color,
    status: 'pending',
    timeLeft: {
      white: timeLeft,
      black: timeLeft,
    },
  };
};
