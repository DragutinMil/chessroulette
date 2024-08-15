import {
  ChessFEN,
  FBHHistory,
  FBHIndex,
  LongChessColor,
  ShortChessMove,
} from '@xmatter/util-kit';
import z from 'zod';

export type GameStatus = 'pending' | 'ongoing' | 'complete';

export const gameTimeClassRecord = z.union([
  z.literal('blitz3'),
  z.literal('blitz5'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('bullet'),
]);

export type GameTimeClass = z.infer<typeof gameTimeClassRecord>;

export type ChessGameTimeMap = {
  [k in GameTimeClass]: number;
};

//TODO - convert all to zod
// TODO: Move these values into a CONSTANTS file
export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  bullet: 60000,
  blitz5: 300000,
  blitz3: 180000,
  rapid: 600000,
  untimed: -1,
};

export type GameDisplayState = {
  fen: ChessFEN;
  history: FBHHistory;
  focusedIndex: FBHIndex;
  turn: LongChessColor;
  lastMove?: ShortChessMove;
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

export type Results = {
  white: number;
  black: number;
};
