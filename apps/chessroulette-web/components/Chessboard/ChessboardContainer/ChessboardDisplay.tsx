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
  onSquareClick?: (square: string, piece?: string) => void;
  //onPieceClick?: (square: string, piece: string | null) => void;
  onPieceDrag?: (piece: string, square: string | null) => void;
  onPieceDrop?: (from: string, to: string, piece?: string | null) => void;
  onArrowsChange: any;
  highlightSquares?: Record<string, any>;
  highlightArrows?: Array<[string, string]>;

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
  onArrowsChange,
  // onChangePuzzleAnimation,
  onCancelPromoMove,
  onSubmitPromoMove,
  onPieceDrag,
  onPieceDrop,
  onSquareClick,
  // onPieceClick,

  ...boardProps
}: ChessboardDisplayProps) => {
  //console.log('boardTheme',boardTheme)

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
        className={` relative overflow-hidden rounded-lg w-full h-full ${containerClassName} transition-all duration-300 ease-in-out 
       
       `}
        style={{
          width: sizePx,
          height: sizePx,
        }}
      >
        <ReactChessboard
          options={{
            boardOrientation: toLongChessColor(boardOrientation),
            position: fen,

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

            onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
              const from = sourceSquare ?? '';
              const to = targetSquare ?? '';
              const pc = piece.pieceType;
              onPieceDrop?.(from, to, pc);
              return true;
            },
            squareStyles,
            darkSquareStyle: {
              backgroundColor: boardTheme.darkSquare,
            },
            lightSquareStyle: {
              backgroundColor: boardTheme.lightSquare,
            },
            dropSquareStyle: {
              border: `5px solid ${boardTheme.hoveredSquare}`,
              boxShadow: boardTheme.hoveredSquare,
            },
            arrowOptions: {
              color: 'rgb(74 222 128)',
              secondaryColor: 'rgba(74, 222, 128, 0.5)',
              tertiaryColor: 'rgba(74, 222, 128, 0.2)',
              arrowLengthReducerDenominator: 2,
              sameTargetArrowLengthReducerDenominator: 3,
              arrowWidthDenominator: 10,
              activeArrowWidthMultiplier: 1.5,
              opacity: 0.8,
              activeOpacity: 1,
            },
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
