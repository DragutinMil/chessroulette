import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  DistributiveOmit,
  ShortChessColor,
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
  onMove: (
    m: ShortChessMove
    // nextFen: ChessFEN
  ) => void;
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

  // const onMoveHandler = useCallback(
  //   (move: ShortChessMove) => {
  //     if (!canPlay) {
  //       return false;
  //     }

  //     if (turn !== playingColor) {
  //       return false;
  //     }

  //     const res = validateMove(move, fen, playingColor);

  //     if (!res.valid) {
  //       return false;
  //     }

  //     onMove(move, res.fen);

  //     return true;
  //   },
  //   [canPlay, turn, onMove]
  // );

  const onValidateMove = useCallback(
    (move: ShortChessMove) => {
      if (!canPlay) {
        return false;
      }

      if (turn !== playingColor) {
        return false;
      }

      // TODO: Add validation for the player's color not being the same as the piece color (especially if s/he plays with a flipped board)

      return validateMove(move, fen, toShortColor(playingColor)).valid;
    },
    [canPlay, turn]
  );

  return (
    <ChessboardContainer
      strict
      turn={toShortColor(turn)}
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      // canMove={(move) => validateMove(move, fen, playingColor).valid}
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
