import {
  FenBoardPromotionalPieceSymbol,
  GetComponentProps,
  ShortChessMove,
} from '@xmatter/util-kit';
import { Piece, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export type ReactChessBoardProps = GetComponentProps<typeof Chessboard>;

export type ChessboardShortMoveWithPiece = ShortChessMove & { piece: Piece };

export type ChessBoardPendingMove = {
  from: Square;
  piece: Piece;
  to?: Square;
  promoteTo?: FenBoardPromotionalPieceSymbol;
};

export type ChessboardPreMove =
  | ChessBoardPendingMove
  | Required<ChessBoardPendingMove>;
