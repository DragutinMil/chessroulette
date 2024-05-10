import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  DistributiveOmit,
  ShortChessMove,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  toShortColor,
} from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  useBoardTheme,
} from '../Chessboard';

type Props = DistributiveOmit<
  ChessboardContainerProps,
  'boardTheme' | 'onMove'
> & {
  playingColor: ChessColor;
  onMove: (m: ShortChessMove, nextFen: ChessFEN) => void;
  canPlay?: boolean;
  overlayComponent?: React.ReactNode;
};

const canMove = (
  move: ChessMove,
  fen: ChessFEN,
  playingColor: ChessColor
):
  | {
      valid: false;
    }
  | {
      valid: true;
      fen: ChessFEN;
    } => {
  const chess = getNewChessGame({ fen });

  if (chess.turn() !== toShortColor(playingColor)) {
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

export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor,
  boardOrientation = playingColor,
  onMove,
  canPlay = true,
  ...props
}: Props) => {
  const boardTheme = useBoardTheme();

  return (
    <ChessboardContainer
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      strict
      canMove={(move) => canMove(move, fen, playingColor).valid}
      onMove={(move) => {
        if (!canPlay) {
          return false;
        }
        const chessInstance = getNewChessGame({ fen });

        if (chessInstance.turn() !== toShortColor(playingColor)) {
          return false;
        }

        const res = canMove(move, fen, playingColor);

        if (!res.valid) {
          return false;
        }

        onMove?.(move, res.fen);

        return true;
      }}
      {...props}
    />
  );
};
