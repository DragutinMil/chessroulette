import {
  ChessColor,
  ChessFENBoard,
  DistributiveOmit,
  ShortChessMove,
  toShortColor,
} from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  CirclesMap,
  useBoardTheme,
} from '../../Chessboard';
import { useCallback, useState } from 'react';
import { validateMove } from './util';

type Props = DistributiveOmit<
  ChessboardContainerProps,
  'boardTheme' | 'onMove' | 'strict' | 'turn'
> & {
  playingColor: ChessColor;
  turn: ChessColor;
  onMove: (m: ShortChessMove) => void;
  canPlay?: boolean;
  overlayComponent?: React.ReactNode;
};

export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor,
  boardOrientation = toShortColor(playingColor),
  onMove,
  canPlay = false,
  turn,
  ...props
}: Props) => {
  const boardTheme = useBoardTheme();
  const [circlesMap, setCirclesMap] = useState<CirclesMap>({});

  const onValidateMove = useCallback(
    (move: ShortChessMove) => {
      if (!canPlay) {
        return false;
      }

      if (turn !== playingColor) {
        return false;
      }

      return validateMove(move, fen, toShortColor(playingColor)).valid;
    },
    [canPlay, turn, fen, playingColor]
  );

  return (
    <ChessboardContainer
      strict
      turn={toShortColor(turn)}
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      onValidateMove={onValidateMove}
      onMove={onMove}
      circlesMap={circlesMap}
      onCircleDraw={(c) => {
        setCirclesMap((prev) => ({
          ...prev,
          [c[0]]: c,
        }));
      }}
      onClearCircles={() => {
        setCirclesMap({});
      }}
      {...props}
    />
  );
};
