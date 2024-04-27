import { useEffect } from 'react';
import useInstance from '@use-it/instance';
import { Chess } from 'chess.js';
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

export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor = 'white',
  boardOrientation = playingColor,
  onMove,
  ...props
}: Props) => {
  const boardTheme = useBoardTheme();
  const chessInstance = useInstance<Chess>(getNewChessGame({ fen }));

  useEffect(() => {
    try {
      chessInstance.load(fen);
    } catch (e) {
      console.error(e);
    }
  }, [fen]);

  return (
    <ChessboardContainer
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      onMove={(m) => {
        if (chessInstance.turn() !== toShortColor(playingColor)) {
          return false;
        }

        // Validate move
        try {
          chessInstance.move(localChessMoveToChessLibraryMove(m));

          onMove?.(m, chessInstance.fen());

          return true;
        } catch (e) {
          return false;
        }
      }}
      {...props}
    />
  );
};
