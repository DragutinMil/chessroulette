import {
  ChessFEN,
  FBHHistory,
  FBHIndex,
  LongChessColor,
  ShortChessMove,
} from '@xmatter/util-kit';
import { GameTimeClass } from './io';

export { type GameTimeClass } from './io';

export type GameDisplayState = {
  fen: ChessFEN;
  history: FBHHistory;
  focusedIndex: FBHIndex;
  turn: LongChessColor;
  lastMove?: ShortChessMove;
};

export type ChessGameTimeMap = {
  [k in GameTimeClass]: number;
};

//TODO - convert all to zod
// TODO: Move these values into a CONSTANTS file
export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  bullet: 60000,
  blitz: 300000,
  blitz3: 180000,
  rapid: 600000,
  untimed: -1,
};

export type PlayerInfo = {
  id: string;
  color: LongChessColor;
  displayName?: string;
};

export type PlayersBySide = {
  home: PlayerInfo;
  away: PlayerInfo;
};

// TODO: These are not needed anymore here are they?
// @depreacate as it doesn't make sense anymore
// The match results should be based on challenger and challengee
export type Old_Play_Results = {
  white: number;
  black: number;
};
