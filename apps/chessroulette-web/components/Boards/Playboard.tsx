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
  playingColor?: ChessColor;
  onMove: (m: ShortChessMove, nextFen: ChessFEN) => void;
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
  playingColor = 'white',
  boardOrientation = playingColor,
  onMove,
  ...props
}: Props) => {
  const boardTheme = useBoardTheme();

  return (
    <ChessboardContainer
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      strict
      canMove={(m) => canMove(m, fen, playingColor).valid}
      onMove={(move) => {
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
