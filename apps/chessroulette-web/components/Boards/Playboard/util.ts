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
    console.debug('[Playboard Error] onMove()', e, { move });
    return {
      valid: false,
    };
  }
};
