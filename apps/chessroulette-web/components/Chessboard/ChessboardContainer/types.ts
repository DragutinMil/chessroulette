import { GetComponentProps } from '@xmatter/util-kit';
import { Piece, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export type ReactChessBoardProps = GetComponentProps<typeof Chessboard>;

export type ChessBoardPendingMove = {
  from: Square;
  piece: Piece;
  to?: Square;
};

export type ChessboardPreMove =
  | ChessBoardPendingMove
  | Required<ChessBoardPendingMove>;
