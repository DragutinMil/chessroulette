import {
  ChessColor,
  ChessFEN,
  ShortChessMove,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  toLongChessColor,
} from '@xmatter/util-kit';
import { ReactChessBoardProps } from './types';
import { BoardTheme } from '@app/hooks/useTheme/defaultTheme';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { PromotionDialogLayer } from './PromotionDialogLayer';

export type ChessboardDisplayProps = Omit<
  ReactChessBoardProps,
  'fen' | 'boardOrientation' 
> & {
  fen: ChessFEN;
  sizePx: number;
  boardTheme: BoardTheme;

  // PromoMove
  promoMove?: ShortChessMove;
  onCancelPromoMove: () => void;
  onSubmitPromoMove: (move: ShortChessMove) => void;
  onChangePuzzleAnimation: boolean;
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
  onChangePuzzleAnimation,
  onCancelPromoMove,
  onSubmitPromoMove,
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
      className={` relative overflow-hidden rounded-lg w-full h-full ${containerClassName} transition-all duration-300 ease-in-out  ${
        onChangePuzzleAnimation ? 'opacity-0 ' : 'opacity-100  '
      }`}
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
        boardOrientation={toLongChessColor(boardOrientation)}
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
          onCancel={onCancelPromoMove}
          onPromotePiece={(p) => {
            onSubmitPromoMove({
              ...promoMove,
              promoteTo: promotionalPieceSanToFenBoardPromotionalPieceSymbol(p),
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
