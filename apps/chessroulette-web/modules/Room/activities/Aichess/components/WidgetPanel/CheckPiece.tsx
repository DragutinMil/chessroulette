import { ChessFEN } from '@xmatter/util-kit';
import { Chess, Square } from 'chess.js';

export async function CheckPiece(fieldFrom: Square, fen: ChessFEN) {
  const chess = new Chess(fen);
  const piece = chess.get(fieldFrom as Square);
  switch (piece.type) {
    case 'p':
      return 'Pawn';
    case 'n':
      return 'Knight';
    case 'b':
      return 'Bishop';
    case 'r':
      return 'Rook';
    case 'q':
      return 'Queen';
    case 'k':
      return 'King';
    default:
      return 'Unknown';
  }
}
