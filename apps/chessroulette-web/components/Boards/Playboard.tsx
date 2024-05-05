import { useEffect } from 'react';
import useInstance from '@use-it/instance';
import { Chess } from 'chess.js';
import {
  ChessColor,
  ChessFENBoard,
  DistributiveOmit,
  getNewChessGame,
  toShortColor,
} from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  useBoardTheme,
} from '../Chessboard';

type Props = DistributiveOmit<ChessboardContainerProps, 'boardTheme'> & {
  playingColor?: ChessColor;
  canPlay?: boolean;
  overlayComponent: React.ReactNode;
};

export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor = 'white',
  boardOrientation = playingColor,
  onMove,
  canPlay = true,
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
        if (!canPlay) {
          return false;
        }
        if (chessInstance.turn() !== toShortColor(playingColor)) {
          return false;
        }

        // Validate move
        try {
          chessInstance.move(m);

          onMove?.(m);

          return true;
        } catch {
          return false;
        }
      }}
      {...props}
    />
  );
};
