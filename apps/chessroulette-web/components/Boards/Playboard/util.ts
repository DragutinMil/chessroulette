import {
  ChessFEN,
  ChessMove,
  ShortChessColor,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
} from '@xmatter/util-kit';

export const validateMove = (
  move: ChessMove,
  fen: ChessFEN,
  playingColor: ShortChessColor
):
  | {
      valid: false;
    }
  | {
      valid: true;
      fen: ChessFEN;
    } => {
  const chess = getNewChessGame({ fen });

  // Validate Turn
  if (chess.turn() !== playingColor) {
    return {
      valid: false,
    };
  }

  // Validate move
  try {
    chess.move(localChessMoveToChessLibraryMove(move));

    return {
      valid: true,
      fen: chess.fen(),
    };
  } catch (e) {
    return { valid: false };
  }
};
export const validatePreMove = (
  move: ChessMove,
  fen: ChessFEN,
  playingColor: ShortChessColor
):
  | {
      valid: false;
    }
  | {
      valid: true;
      fen: ChessFEN;
    } => {
  const parts = fen.split(' ');
  // change color to pass move
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  const newFen = parts.join(' ');
  const chess = getNewChessGame({ fen: newFen });
  // Validate move
  try {
    chess.move(localChessMoveToChessLibraryMove(move));

    return {
      valid: true,
      fen: chess.fen(),
    };
  } catch (e) {
    return { valid: false };
  }
};
export function squareEmpty(m: string, fen: string): boolean {
  const board = fen.split(' ')[0];

  // 2. Pretvoriti square u indeks
  const file = m[0]; // 'b'
  const rank = m[1]; // '1'

  const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0); // 0–7
  const rankIndex = 8 - parseInt(rank); // FEN ima rank 8 na vrhu

  // 3. Raspakuj rank
  const ranks = board.split('/');

  const row = ranks[rankIndex];
  if (!row) return false; // ako je nešto čudno u FEN-u

  let col = 0;

  for (const ch of row) {
    // broj → prazna polja
    if (!isNaN(Number(ch))) {
      const emptyCount = parseInt(ch);
      if (fileIndex < col + emptyCount) {
        return true; // square upada u prazni segment
      }
      col += emptyCount;
      continue;
    }

    // figura → jedno polje
    if (col === fileIndex) {
      return false; // polje zauzeto
    }

    col += 1;
  }

  return true;
}
