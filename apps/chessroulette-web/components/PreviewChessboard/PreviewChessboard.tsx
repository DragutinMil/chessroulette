import { AspectRatio } from '../AspectRatio';
import React, { useMemo } from 'react';
import {
  ChessFEN,
  ChessFENBoard,
  fenBoardPieceSymbolToDetailedChessPiece,
  isObject,
  keyInObject,
  matrixMap,
} from '@xmatter/util-kit';
// import { fenBoardPieceSymbolToDetailed } from 'util-kit/src/lib/ChessFENBoard/chessUtils';
import './styles.css';
import { pieces } from './assets/pieces';
import { BackgroundLayer } from './BackgroundLayer';

export type PreviewChessboardProps = {
  fen: ChessFEN | 'empty';
  isFlipped?: boolean;
  lightSquareColor?: string;
  darkSquareColor?: string;
};

/**
 * This is important because it's much liter than an interactive chessboard
 * and also can be server rendered
 */
export const PreviewChessboard = React.memo(
  ({
    fen,
    isFlipped,
    lightSquareColor = '#fff',
    darkSquareColor = '#000',
  }: PreviewChessboardProps) => {
    const pieceLayer = useMemo(() => {
      if (fen === 'empty') {
        return null;
      }

      const fenBoard = new ChessFENBoard(fen);

      const squareSizeInPct = 12.5;
      const squareSizePct = `${squareSizeInPct}%`;

      return (
        <div className="absolute top-0 right-0 left-0 bottom-0">
          {matrixMap(fenBoard.board, (p, [row, col]) => {
            if (!p) {
              return;
            }

            const { color, type: piece } =
              fenBoardPieceSymbolToDetailedChessPiece(p);

            const img =
              pieces[`${color}${piece.toUpperCase()}` as keyof typeof pieces];
            const imgSrc =
              isObject(img) && keyInObject(img, 'src') ? img.src : img;

            // TODO: Do I need this???
            // const currentZindex = row * 10 + col;
            // const zIndex = isFlipped ? -100 - currentZindex : currentZindex;

            const key = `${row}-${col}`;

            return (
              <div
                key={key}
                className="absolute"
                style={{
                  left: `${col * squareSizeInPct}%`,
                  top: `${row * squareSizeInPct}%`,
                  width: squareSizePct,
                  // zIndex,
                  transition: 'all 150ms linear',
                  color: 'black',
                }}
              >
                {/* {key} */}
                <img src={imgSrc} className="w-full" />
              </div>
            );
          })}
        </div>
      );
    }, [fen, isFlipped]);

    return (
      <AspectRatio aspectRatio={1} className="relative">
        <BackgroundLayer
          lightColor={lightSquareColor}
          darkColor={darkSquareColor}
        />
        {pieceLayer}
      </AspectRatio>
    );
  }
);
