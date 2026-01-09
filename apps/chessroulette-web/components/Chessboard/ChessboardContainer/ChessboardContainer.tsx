import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
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
//import { ChessboardSquare } from './ChessboardSquare';
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
  //onValidatePreMove?: (m: ShortChessMove) => boolean;
  isSquareEmpty?: (m: string) => boolean;
  onValidateMove?: (m: ShortChessMove) => boolean;
  //onValidatePromoMove?: (m: ShortChessMove) => boolean;
  onMove: (m: ShortChessMove) => void;
  // onChangePuzzleAnimation?: boolean;
  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
  arrowColor?: string;
  lastMove?: ShortChessMove;
  boardOrientation?: ChessColor;
  containerClassName?: string;
  stopEngineMove?: boolean;
  onLastMoveWasPromotionChange?: (wasPromotion: boolean) => void;
  onPieceDrop?: (from: Square, to: Square, piece?: string) => void;
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
  // onValidatePreMove = () => true,
  isSquareEmpty = () => true,
  // onValidatePromoMove= () => true,
  onValidateMove = () => true, // Defaults to always be able to move
  boardOrientation = 'w',
  stopEngineMove,
  onLastMoveWasPromotionChange,
  rightSideComponent,
  rightSideSizePx = 0,
  rightSideClassName,
  boardTheme,
  sizePx,
  turn,
  // onChangePuzzleAnimation,
  overlayComponent,
  ...props
}) => {
  const isMyTurn = boardOrientation === turn;
  const { match, ...matchView } = useMatchViewState();
  const BOARD_ANIMATION_DELAY = useMemo(() => {
    return match === null ? (!lastMove ? 0 : 360) : 220;
  }, [match, lastMove]);
  const engineMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [isBotPlay, setBots] = useState(false);
  const arrowAndCircleColor = useArrowAndCircleColor();
  const arrows = useCustomArrows(onArrowsChange, props.arrowsMap);
  //console.log('arrows', arrows);

  useEffect(() => {
    setBots(
      match?.challengee?.id?.length === 16 ||
        match?.challenger?.id?.length === 16
    );
  }, [match?.challengee?.id]);

  // Circles
  const drawCircle = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowAndCircleColor]);
    },
    [onCircleDraw, arrowAndCircleColor]
  );

  const resetArrowsAndCircles = useCallback(() => {
    if (Object.keys(circlesMap || {}).length > 0) {
      onClearCircles();
    }
    if (Object.keys(props.arrowsMap || {}).length > 0) {
      onArrowsChange({});
    }
  }, [circlesMap, props.arrowsMap, onClearCircles, onArrowsChange]);

  // Moves
  const { preMove, promoMove, pendingMove, ...moveActions } = useMoves({
    playingColor: boardOrientation,
    isMyTurn,
    premoveAnimationDelay: BOARD_ANIMATION_DELAY + 1,
    onValidateMove,
    onMove,
    onPreMove: onMove,
    isSquareEmpty,
    // Event to reset the circles and arrows when any square is clicked or dragged
    // onSquareClickOrDrag: resetArrowsAndCircles,
  });

  const customStyles = useCustomStyles({
    boardTheme,
    fen,
    lastMove,
    pendingMove,
    preMove,
    circlesMap,
    isMyTurn,
    ...props,
  });
  useEffect(() => {
    if (stopEngineMove) {
      if (engineMoveTimeoutRef.current) {
        clearTimeout(engineMoveTimeoutRef.current);
        engineMoveTimeoutRef.current = null;
      }
    }
  }, [stopEngineMove]);
  const engineMove = useCallback(
    (m: any) => {
      const from = m.slice(0, 2);
      const to = m.slice(2, 4);
      const promo = m[4];

      if (promo === 'q') {
        engineMoveTimeoutRef.current = setTimeout(() => {
          onMove({ from, to, promoteTo: promo });
        }, 2000);
      } else {
        if (
          match?.challengee.id.slice(-3) === '000' ||
          match?.challenger.id.slice(-3) === '000'
        ) {
          const randomDelay = (min = 0, max = 5000) =>
            Math.floor(Math.random() * (max - min + 1)) + min;
          engineMoveTimeoutRef.current = setTimeout(() => {
            onMove({ from, to });
          }, randomDelay());
        } else {
          onMove({ from, to });
        }
      }
    },
    [onMove]
  );

  if (sizePx === 0) {
    return null;
  }

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
        onPieceDrag={(square, piece) => {
          if (!piece || !square) return;
          moveActions.onPieceDrag(square as Square, piece as PieceSan);
        }}
        onPieceDrop={(sourceSquare, targetSquare, piece?) => {
          if (!piece || !sourceSquare || !targetSquare) return false;
          // console.log(piece, sourceSquare, targetSquare);
          moveActions.onPieceDrop(
            sourceSquare as Square,
            targetSquare as Square,
            piece as PieceSan
          );
          return true;
        }}
        onSquareClick={(square, piece) => {
          moveActions.onSquareClick(
            square as Square,
            piece ? (piece as PieceSan) : undefined
          );
        }}
        // Promo Move
        lastMove={lastMove}
        promoMove={promoMove}
        onCancelPromoMove={moveActions.onClearPromoMove}
        onSubmitPromoMove={moveActions.onPromoSubmit}
        // Overlay & Right Components
        rightSideClassName={rightSideClassName}
        rightSideComponent={rightSideComponent}
        rightSideSizePx={rightSideSizePx}
        overlayComponent={overlayComponent}
        // Board Props
        squareStyles={customStyles.squareStyles}
        highlightSquares={customStyles.squareStyles}
        // highlightArrows={arrows.arrowsToRender}
        // squareRenderer={ChessboardSquare}
        // onMouseOverSquare={setHoveredSquare}
        // Arrows
        arrowColor={arrowAndCircleColor} //sklonjeno u deo arrowOptions
        onArrowsChange={arrows.arrowsToRender}
        // circles
        // onSquareRightClick={drawCircle}
        {...props}
        animationDurationInMs={BOARD_ANIMATION_DELAY}
      />
    </div>
  );
};
