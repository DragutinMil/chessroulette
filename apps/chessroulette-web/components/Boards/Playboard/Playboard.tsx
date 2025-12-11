import {
  ChessColor,
  ChessFENBoard,
  DistributiveOmit,
  ShortChessMove,
} from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  CirclesMap,
  useBoardTheme,
} from '../../Chessboard';
import { useCallback, useState } from 'react';
import { validateMove, validatePromoMove, squareEmpty } from './util';

export type PlayboardProps = DistributiveOmit<
  ChessboardContainerProps,
  'boardTheme' | 'onMove' | 'strict' | 'turn'
> & {
  playingColor: ChessColor;
  turn: ChessColor;
  onMove: (m: ShortChessMove) => void;
  onLastMoveWasPromotionChange?: (wasPromotion: boolean) => void;
  canPlay?: boolean;
  overlayComponent?: React.ReactNode;
};

/**
 * This board validates the moves based on the Chess rules
 *
 * @param param0
 * @returns
 */
export const Playboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  playingColor,
  boardOrientation = playingColor,
  onMove,
  onLastMoveWasPromotionChange,
  canPlay = false,
  turn,
  ...props
}: PlayboardProps) => {
  const boardTheme = useBoardTheme();
  //const [circlesMap, setCirclesMap] = useState<CirclesMap>({});
  // const onValidatePreMove = (move: ShortChessMove) => {
  //   return validatePreMove(move, fen, playingColor).valid;
  // };

  const isSquareEmpty = (m: string) => squareEmpty(m, fen);

  const onValidateMove = useCallback(
    (move: ShortChessMove) => {
      if (!canPlay) {
        return false;
      }
      if (turn !== playingColor) {
        return false;
      }

      return validateMove(move, fen, playingColor).valid;
    },
    [canPlay, turn, fen, playingColor]
  );
  const onValidatePromoMove = useCallback(
    (move: ShortChessMove) => {
      if (!canPlay) {
        return false;
      }
      if (turn !== playingColor) {
        return false;
      }

      return validatePromoMove(move, fen, playingColor).valid;
    },
    [canPlay, turn, fen, playingColor]
  );

  return (
    <ChessboardContainer
      {...props}
      strict
      turn={turn}
      // onChangePuzzleAnimation={onChangePuzzleAnimation}
      fen={fen}
      boardOrientation={boardOrientation}
      boardTheme={boardTheme}
      onValidateMove={onValidateMove}
      // onValidatePromoMove={onValidatePromoMove}
      //  onValidatePreMove={onValidatePreMove}
      // isSquareEmpty={isSquareEmpty}
      onMove={onMove}
      circlesMap={props.circlesMap}
      // onCircleDraw={(c) => {
      //   setCirclesMap((prev) => ({
      //     ...prev,
      //     [c[0]]: c,
      //   }));
      // }}
      // onClearCircles={() => {
      //   setCirclesMap({});
      // }}
      onLastMoveWasPromotionChange={onLastMoveWasPromotionChange}
    />
  );
};
