import { ChessGameTimeMap } from './types';

export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  bullet: 60000,
  bulletplus1: 60000,
  bullet2plus1: 120000,
  bullet2: 120000,
  blitz: 300000,
  blitzplus2: 300000,
  blitz3: 180000,
  blitz3plus2: 180000,
  rapid: 600000,
  untimed: -1,
};
