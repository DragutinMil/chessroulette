import {
  ChessFEN,
  PieceSan,
  ShortChessMove,
  ShortChessColor,
  toLongColor,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import React, { useCallback, useState } from 'react';
import { useArrowAndCircleColor } from '../hooks/useArrowAndCircleColor';
import { ArrowsMap, CircleDrawTuple, CirclesMap } from '../types';
import { noop } from 'movex-core-util';
import { ChessboardSquare } from './ChessboardSquare';
import { BoardTheme } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { useCustomArrows } from './hooks/useArrows';
import { ReactChessBoardProps } from './types';
import { useCustomStyles } from './hooks/useCustomStyles';
import { ChessboardDisplay } from './ChessboardDisplay';
import { useMoves } from './hooks/useMoves';

// TODO: Need to Pick/Omit the DisplayProps instead of the ChessboardProps directly
export type ChessboardContainerProps = Omit<
  ReactChessBoardProps,
  'position' | 'onArrowsChange' | 'boardOrientation' | 'onPieceDrop'
> & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;

  // Move
  onValidateMove?: (m: ShortChessMove) => boolean;
  onMove: (m: ShortChessMove) => void;

  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
  arrowColor?: string;
  lastMove?: ShortChessMove;
  boardOrientation?: ShortChessColor;
  containerClassName?: string;

  onPieceDrop?: (from: Square, to: Square, piece: PieceSan) => void;
  onArrowsChange?: (arrows: ArrowsMap) => void;
  onCircleDraw?: (circleTuple: CircleDrawTuple) => void;
  onClearCircles?: () => void;

  overlayComponent?: React.ReactNode;
} & (
    | {
        rightSideComponent: React.ReactNode;
        rightSideSizePx: number;
        rightSideClassName?: string;
      }
    | {
        rightSideComponent?: undefined;
        rightSideSizePx?: undefined;
        rightSideClassName?: undefined;
      }
  ) &
  (
    | {
        // When this is true the player can only touch the pieces on her side
        strict: true;
        turn: ShortChessColor;
      }
    | {
        strict?: false;
        turn?: ShortChessColor;
      }
  );

export const ChessboardContainer: React.FC<ChessboardContainerProps> = ({
  fen,
  lastMove,
  strict,
  circlesMap,
  onArrowsChange = noop,
  onCircleDraw = noop,
  onClearCircles = noop,
  onPieceDrop,
  onMove,
  onValidateMove = () => true, // Defaults to always be able to move
  boardOrientation = 'w',
  customSquareStyles,
  rightSideComponent,
  rightSideSizePx = 0,
  rightSideClassName,
  boardTheme,
  sizePx,
  turn,
  overlayComponent,
  ...props
}) => {
  const isMyTurn = boardOrientation === turn;

  // Arrows
  const arrowAndCircleColor = useArrowAndCircleColor();
  const customArrows = useCustomArrows(onArrowsChange, props.arrowsMap);

  // Circles
  const drawCircle = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowAndCircleColor]);
    },
    [onCircleDraw, arrowAndCircleColor]
  );

  const resetArrowsAndCircles = () => {
    console.log('resetArrowsAndCircles');
    // Reset the Arrows and Circles if present
    if (Object.keys(circlesMap || {}).length > 0) {
      onClearCircles();
    }

    if (Object.keys(props.arrowsMap || {}).length > 0) {
      // Reset the arrows on square click
      onArrowsChange({});
    }
  };

  // Moves
  const { ...moves } = useMoves({
    fen,
    turn,
    isMyTurn,
    onMove,
    onValidateMove,

    // Event to reset the circles and arrows when any square is clicked or dragged
    onSquareClickOrDrag: resetArrowsAndCircles,
  });

  // Styles
  const [hoveredSquare, setHoveredSquare] = useState<Square>();

  const customStyles = useCustomStyles({
    boardTheme,
    fen,
    lastMove,
    pendingMove: moves.pendingMove,
    // preMove, // TODO: Add back
    circlesMap,
    isMyTurn,
    hoveredSquare,
    customSquareStyles,
    ...props,
  });

  if (sizePx === 0) {
    return null;
  }

  return (
    <ChessboardDisplay
      fen={fen}
      sizePx={sizePx}
      boardTheme={boardTheme}
      boardOrientation={toLongColor(boardOrientation)}
      // Moves
      onPieceDragBegin={moves.onPieceDrag}
      onSquareClick={moves.onSquareClick}
      onPieceDrop={moves.onPieceDrop}
      // Promo Move
      promoMove={moves.promoMove}
      onCancelPromoMove={moves.onClearPromoMove}
      onSubmitPromoMove={onMove}
      // Overlay & Right Components
      rightSideClassName={rightSideClassName}
      rightSideComponent={rightSideComponent}
      rightSideSizePx={rightSideSizePx}
      overlayComponent={overlayComponent}
      // Board Props
      customBoardStyle={customStyles.customBoardStyle}
      customLightSquareStyle={customStyles.customLightSquareStyle}
      customDarkSquareStyle={customStyles.customDarkSquareStyle}
      customSquareStyles={customStyles.customSquareStyles}
      customSquare={ChessboardSquare}
      onMouseOverSquare={setHoveredSquare}
      // Arrows
      customArrowColor={arrowAndCircleColor}
      customArrows={customArrows.arrowsToRender}
      onArrowsChange={customArrows.updateArrowsMap}
      // circles
      onSquareRightClick={drawCircle}
      customPieces={boardTheme.customPieces}
      {...props}
    />
  );
};
