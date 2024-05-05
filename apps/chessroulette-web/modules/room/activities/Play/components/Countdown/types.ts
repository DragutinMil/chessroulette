import { GameType } from '../../types';

export type ChessGameTimeMap = {
  [k in GameType]: number;
};

export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  blitz: 1,
  rapid: 5,
  untimed: 0,
};
