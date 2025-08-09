import React, { useCallback, useEffect, useState } from 'react';
import {
  ChessFEN,
  PieceSan,
  ShortChessMove,
  ChessColor,
  isPromotableMove,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import { useArrowAndCircleColor } from '../hooks/useArrowAndCircleColor';
import { ArrowsMap, CircleDrawTuple, CirclesMap } from '../types';
import { noop } from 'movex-core-util';
import { ChessboardSquare } from './ChessboardSquare';
import { BoardTheme } from '@app/hooks/useTheme/defaultTheme';
import { useCustomArrows } from './hooks/useArrows';
import { useCustomStyles } from './hooks/useCustomStyles';
import { ChessboardDisplay, ChessboardDisplayProps } from './ChessboardDisplay';
import { useMoves } from './hooks/useMoves';
import StockFishEngine from '@app/modules/ChessEngine/ChessEngineBots';
import { useMatchViewState } from '../../../modules/Match/hooks/useMatch';
import { boolean } from 'zod';

export type ChessboardContainerProps = Omit<
  ChessboardDisplayProps,
  | 'onArrowsChange'
  | 'boardOrientation'
  | 'onPieceDrop'
  | 'onCancelPromoMove'
  | 'onSubmitPromoMove'
> & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;

  // Move
  onValidateMove?: (m: ShortChessMove) => boolean;
  onMove: (m: ShortChessMove) => void;
  onChangePuzzleAnimation?: boolean;
  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
  arrowColor?: string;
  lastMove?: ShortChessMove;
  boardOrientation?: ChessColor;
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
        turn: ChessColor;
      }
    | {
        strict?: false;
        turn?: ChessColor;
      }
  );

const BOARD_ANIMATION_DELAY = 200;

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
  onChangePuzzleAnimation,
  overlayComponent,
  ...props
}) => {
  const isMyTurn = boardOrientation === turn;
  const { match, ...matchView } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
  // Arrows
  // ('8WCVE7ljCQJTW020,NaNuXa7Ew8Kac002,O8kiLgwcKJWy9005,KdydnDHbBU1JY008,vpHH6Jf7rYKwN010,ruuPkmgP0KBei015');
  const arrowAndCircleColor = useArrowAndCircleColor();
  const customArrows = useCustomArrows(onArrowsChange, props.arrowsMap);
  //console.log('boardTheme',boardTheme)
  useEffect(() => {
    if (match) {
      if (match?.challengee?.id?.length == 16) {
        setBots(true);
      }
      //  setBots( ['8WCVE7ljCQJTW020','NaNuXa7Ew8Kac002','O8kiLgwcKJWy9005','KdydnDHbBU1JY008','vpHH6Jf7rYKwN010','ruuPkmgP0KBei015'].indexOf(match?.challengee?.id)!==-1 )
    }
  }, []);

  // Circles
  const drawCircle = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowAndCircleColor]);
    },
    [onCircleDraw, arrowAndCircleColor]
  );

  const resetArrowsAndCircles = () => {
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
  const { preMove, promoMove, pendingMove, ...moveActions } = useMoves({
    playingColor: boardOrientation,
    isMyTurn,
    premoveAnimationDelay: BOARD_ANIMATION_DELAY + 1,
    onValidateMove,
    onMove,
    onPreMove: onMove,

    // Event to reset the circles and arrows when any square is clicked or dragged
    onSquareClickOrDrag: resetArrowsAndCircles,
  });

  // Styles
  const customStyles = useCustomStyles({
    boardTheme,
    fen,
    lastMove,
    pendingMove,
    preMove,
    circlesMap,
    isMyTurn,
    customSquareStyles,
    ...props,
  });

  if (sizePx === 0) {
    return null;
  }
  const engineMove = (m: any) => {
    let fromChess = m.slice(0, 2);
    let toChess = m.slice(2, 4);
    if (m.length == 5 && m.slice(-1) == 'q') {
      let promotionChess = m.slice(4, 5);
      let n = { from: fromChess, to: toChess, promoteTo: promotionChess };
      onMove(n);
    } else {
      let n = { from: fromChess, to: toChess };
      onMove(n);
    }
  };
  return (
    <div>
      {match?.challengee.id && isBotPlay && (
        <StockFishEngine
          bot={match?.challengee.id}
          fen={fen}
          isMyTurn={isMyTurn}
          engineMove={engineMove}
        />
      )}

      <ChessboardDisplay
        fen={fen}
        sizePx={sizePx}
        boardTheme={boardTheme}
        boardOrientation={boardOrientation}
        // Moves
        onPieceDragBegin={moveActions.onPieceDrag}
        onSquareClick={moveActions.onSquareClick}
        onPieceDrop={moveActions.onPieceDrop}
        // Promo Move
        promoMove={promoMove}
        onCancelPromoMove={moveActions.onClearPromoMove}
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
        // onMouseOverSquare={setHoveredSquare}
        // Arrows
        customArrowColor={arrowAndCircleColor}
        customArrows={customArrows.arrowsToRender}
        onArrowsChange={customArrows.updateArrowsMap}
        // circles
        onSquareRightClick={drawCircle}
        customPieces={boardTheme.customPieces}
        animationDuration={BOARD_ANIMATION_DELAY}
        onChangePuzzleAnimation={onChangePuzzleAnimation}
        {...props}
      />
    </div>
  );
};
