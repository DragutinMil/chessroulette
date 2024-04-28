import type { Color, PieceSymbol, Square } from 'chess.js';
import type { Matrix } from '../matrix';
import {
  BlackColor,
  ChessColor,
  ShortChessColor,
  ShortChessMove,
  WhiteColor,
} from '../Chess/types';

export type AbsoluteCoord = {
  x: number;
  y: number;
};

export type RelativeCoord = {
  row: number;
  col: number;
};

export type FenBoardPieceSymbol = PieceSymbol | Uppercase<PieceSymbol>;
export type FenBoardPromotionalPieceSymbol = Exclude<
  FenBoardPieceSymbol,
  'K' | 'k' | 'p' | 'P'
>;

export type FENBoard = Matrix<FenBoardPieceSymbol | ''>;

export type ChessBoard = Matrix<{
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null>;

export type BaseFreeBoardDetailedChessMove = ShortChessMove & {
  color: ChessColor;
  piece: FenBoardPieceSymbol;
  captured?: FenBoardPieceSymbol;
  san: string;
};

export type WhiteFreeBoardDetailedChessMove = BaseFreeBoardDetailedChessMove & {
  color: WhiteColor;
};

export type BlackFreeBoardDetailedChessMove = BaseFreeBoardDetailedChessMove & {
  color: BlackColor;
};

export type FreeBoardDetailedChessMove =
  | WhiteFreeBoardDetailedChessMove
  | BlackFreeBoardDetailedChessMove;
