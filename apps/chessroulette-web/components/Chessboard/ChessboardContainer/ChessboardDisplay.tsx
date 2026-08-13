import {
  ChessColor,
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  toLongChessColor,
} from '@xmatter/util-kit';
import { ReactChessBoardProps, ChessboardPreMove } from './types';
import { BoardTheme } from '@app/hooks/useTheme/defaultTheme';
import type { CSSProperties } from 'react';
import {
  Chessboard as ReactChessboard,
  type ChessboardOptions,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs,
  type PieceHandlerArgs,
} from 'react-chessboard';
import { PromotionDialogLayer } from './PromotionDialogLayer';

export type ChessboardDisplayProps = Omit<
  ReactChessBoardProps,
  'fen' | 'boardOrientation'
> & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;
  lastMove?: ShortChessMove;
  // PromoMove
  promoMove?: ShortChessMove;
  onCancelPromoMove: () => void;
  onSubmitPromoMove: (move: ShortChessMove) => void;
  squareStyles?: any;
  squareRenderer?: ChessboardOptions['squareRenderer'];
  animationDurationInMs?: number;
  onSquareClick?: (square: string, piece?: string) => void;
  //onPieceClick?: (square: string, piece: string | null) => void;
  onPieceDrag?: (square: string | null, piece: string) => void;
  onPieceDragCancel?: () => void;
  onPieceDrop?: (from: string, to: string, piece?: string | null) => void;
  onArrowsChange: any;
  // displayArrows?: any;
  highlightSquares?: Record<string, any>;
  //highlightArrows?: Array<[string, string]>;

  containerClassName?: string;
  overlayComponent?: React.ReactNode;
  boardOrientation?: ChessColor;
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
  );

export const ChessboardDisplay = ({
  sizePx,
  rightSideClassName,
  rightSideComponent,
  rightSideSizePx = 0,
  containerClassName,
  overlayComponent,
  fen,
  boardOrientation = 'w',
  promoMove,
  boardTheme,
  lastMove,
  squareStyles,
  squareRenderer,
  onArrowsChange,
  // displayArrows,

  // onChangePuzzleAnimation,
  onCancelPromoMove,
  onSubmitPromoMove,
  onPieceDrag,
  onPieceDragCancel,
  onPieceDrop,
  onSquareClick,
  animationDurationInMs,
  // onPieceClick,

  ...boardProps
}: ChessboardDisplayProps) => {
  // console.log('animationDurationInMs',animationDurationInMs);
  return (
    <div
      className="flex"
      style={{
        height: sizePx + rightSideSizePx,
        width: sizePx + rightSideSizePx,
        marginRight: -rightSideSizePx,
        marginBottom: -rightSideSizePx,
      }}
    >
      <div
        className={`board-no-touch-scroll relative overflow-hidden rounded-lg w-full h-full ${containerClassName} transition-colors duration-300 ease-in-out`}
        style={{
          width: sizePx,
          height: sizePx,
          touchAction: 'none',
        }}
      >
        <ReactChessboard
          options={{
            boardOrientation: toLongChessColor(boardOrientation),
            position: fen,
            //  pieces:{boardTheme.renderPiece},
            onSquareClick: ({ square, piece }: SquareHandlerArgs) => {
              const sq = square ?? '';
              const pc = piece?.pieceType;
              onSquareClick?.(sq, pc);
            },
            allowDragging: true,
            onPieceDrag: ({ square, piece }: PieceHandlerArgs) => {
              const sq = square ?? '';
              const pc = piece?.pieceType;
              onPieceDrag?.(sq, pc);
            },
            onPieceDragCancel: () => {
              onPieceDragCancel?.();
            },

            onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
              const from = sourceSquare ?? '';
              const to = targetSquare ?? '';
              const pc = piece.pieceType;
              return onPieceDrop?.(from, to, pc) || false;
              // return true;
            },
            squareStyles,
            squareRenderer,
            darkSquareStyle: {
              backgroundColor: boardTheme.darkSquare,
            },
            lightSquareStyle: {
              backgroundColor: boardTheme.lightSquare,
            },
            dropSquareStyle: {
              outlineOffset: '-5px',
              outline: `5px solid ${boardTheme.hoveredSquare}`,
              boxShadow: boardTheme.hoveredSquare,
            },
            arrows: onArrowsChange,
            // arrows: Array.isArray(displayArrows) ? displayArrows : undefined,
            // onArrowsChange,
            arrowOptions: {
              color: boardTheme.arrowColors[1],
              secondaryColor: 'rgb(74 222 128)',
              tertiaryColor: 'rgb(74 222 128)',
              // The `colors` map is what the library actually reads now
              // (color/secondaryColor/tertiaryColor above are just the
              // deprecated fallback it also still honors) — its type is
              // required, not optional, so this has to be here or the
              // build fails. Mapped 1:1 to the legacy colors above; alt/meta
              // are new modifier combos we don't use yet, so they just
              // reuse the default color (no behavior change).
              colors: {
                default: boardTheme.arrowColors[1],
                shift: 'rgb(74 222 128)',
                ctrl: 'rgb(74 222 128)',
                alt: boardTheme.arrowColors[1],
                meta: boardTheme.arrowColors[1],
              },
              arrowLengthReducerDenominator: 4,
              sameTargetArrowLengthReducerDenominator: 4,
              arrowWidthDenominator: 5.2,
              activeArrowWidthMultiplier: 1.2,
              opacity: 0.8,
              activeOpacity: 1,
              // Since we pass a custom arrowOptions object it fully replaces
              // react-chessboard's defaultArrowOptions (no merge) — any new
              // field the library adds must be listed here too, or it's
              // `undefined` and breaks the arrow math (NaN path → invisible
              // arrow). arrowStartOffset was added in 5.9.0; 0 matches the
              // library's own default (arrow starts at square center).
              arrowStartOffset: 0,
            },
            animationDurationInMs: animationDurationInMs,
          }}
          {...boardProps}
        />

        {promoMove && (
          <PromotionDialogLayer
            boardSizePx={sizePx}
            promotionSquare={promoMove.to}
            boardOrientation={boardOrientation}
            renderPromotablePiece={boardTheme.renderPiece}
            onCancel={onCancelPromoMove}
            onPromotePiece={(p) => {
              onSubmitPromoMove({
                ...promoMove,
                promoteTo:
                  promotionalPieceSanToFenBoardPromotionalPieceSymbol(p),
              });
            }}
          />
        )}
        {overlayComponent}
      </div>
      <div
        className={`hidden md:flex w-full relative h-full ${rightSideClassName}`}
        style={{ width: rightSideSizePx }}
      >
        {rightSideComponent}
      </div>
    </div>
  );
};
