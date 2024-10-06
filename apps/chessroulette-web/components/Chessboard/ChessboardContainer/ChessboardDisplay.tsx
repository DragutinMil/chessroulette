import {
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
} from '@xmatter/util-kit';
import { ReactChessBoardProps } from './types';
import { BoardTheme } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { PromotionDialogLayer } from './PromotionDialogLayer';

export type ChessboardDisplayProps = ReactChessBoardProps & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;

  // PromoMove
  promoMove?: ShortChessMove;
  onCancelPromoMove: () => void;
  onSubmitPromoMove: (move: ShortChessMove) => void;
  // arrowsMap?: ArrowsMap;
  // circlesMap?: CirclesMap;
  // arrowColor?: string;
  // lastMove?: ShortChessMove;
  // boardOrientation?: LongChessColor;
  containerClassName?: string;
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
  );

export const ChessboardDisplay = ({
  sizePx,
  rightSideClassName,
  rightSideComponent,
  rightSideSizePx = 0,
  containerClassName,
  overlayComponent,
  fen,
  boardOrientation = 'white',
  promoMove,
  boardTheme,
  onCancelPromoMove,
  onSubmitPromoMove,

  // customStyles,
  ...boardProps
}: ChessboardDisplayProps) => (
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
      className={`relative overflow-hidden rounded-lg w-full h-full ${containerClassName}`}
      style={{
        width: sizePx,
        height: sizePx,
      }}
    >
      <ReactChessboard
        id="Chessboard" // TODO: should this be unique per instance?
        position={fen}
        boardWidth={sizePx}
        showBoardNotation
        snapToCursor={false}
        arePiecesDraggable
        {...boardProps}
        // Take out the native promotion dialog out in favor of the custom one
        autoPromoteToQueen={false}
        onPromotionCheck={() => false}
      />

      {promoMove && (
        <PromotionDialogLayer
          boardSizePx={sizePx}
          promotionSquare={promoMove.to}
          boardOrientation={boardOrientation}
          renderPromotablePiece={boardTheme.renderPiece}
          onCancel={() => {
            // setPromoMove(undefined);
            onCancelPromoMove();
          }}
          onPromotePiece={(p) => {
            onSubmitPromoMove({
              ...promoMove,
              promoteTo: promotionalPieceSanToFenBoardPromotionalPieceSymbol(p),
            });

            // onClearPromoMove?.();
            // setPromoMove(undefined);
          }}
        />
      )}
      {overlayComponent}
    </div>
    <div
      className={`w-full relative h-full ${rightSideClassName}`}
      style={{ width: rightSideSizePx }}
    >
      {rightSideComponent}
    </div>
  </div>
);
