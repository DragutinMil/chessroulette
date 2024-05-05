import { GameType } from '../../types';

export type ChessGameTimeMap = {
  [k in GameType]: number;
};

export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  flash: 10000,
  blitz: 60000,
  rapid: 300000,
  untimed: -1,
};
