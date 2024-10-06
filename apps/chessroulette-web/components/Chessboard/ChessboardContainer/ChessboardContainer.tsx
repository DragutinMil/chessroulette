import {
  ChessFEN,
  ChessFENBoard,
  PieceSan,
  ShortChessMove,
  invoke,
  fenBoardPieceSymbolToDetailedChessPiece,
  isPromotableMove,
  pieceSanToPiece,
  ShortChessColor,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useArrowAndCircleColor } from '../hooks/useArrowAndCircleColor';
import { ArrowsMap, CircleDrawTuple, CirclesMap } from '../types';
import { noop } from 'movex-core-util';
import { ChessboardSquare } from './ChessboardSquare';
import useInstance from '@use-it/instance';
import { BoardTheme } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { useCustomArrows } from './hooks/useArrows';
import {
  ChessBoardPendingMove,
  ChessboardPreMove,
  ReactChessBoardProps,
} from './types';
import { useCustomStyles } from './hooks/useCustomStyles';
import { ChessboardDisplay } from './ChessboardDisplay';

export type ChessboardContainerProps = Omit<
  ReactChessBoardProps,
  'position' | 'onArrowsChange' | 'boardOrientation' | 'onPieceDrop'
> & {
  fen: ChessFEN;
  sizePx: number;
  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
  arrowColor?: string;
  lastMove?: ShortChessMove;
  boardOrientation?: ShortChessColor;
  containerClassName?: string;
  // Defaults to always be able to move
  canMove?: (
    m: ShortChessMove & {
      // color: ShortChessColor
    }
  ) => boolean;
  // If canMove is present, only then the onMove gets called
  onMove?: (m: ShortChessMove) => boolean;
  onPremove?: (m: ShortChessMove) => boolean;
  onPieceDrop?: (from: Square, to: Square, piece: PieceSan) => void;
  onArrowsChange?: (arrows: ArrowsMap) => void;
  onCircleDraw?: (circleTuple: CircleDrawTuple) => void;
  onClearCircles?: () => void;
  boardTheme: BoardTheme;
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
  onArrowsChange,
  onCircleDraw = noop,
  onPieceDrop = noop,
  onMove,
  onPremove,
  canMove = () => true, // Defaults to always be able to move
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
  const [hoveredSquare, setHoveredSquare] = useState<Square>();

  // Arrows and circle

  const arrowAndCircleColor = useArrowAndCircleColor();
  const customArrows = useCustomArrows(onArrowsChange, props.arrowsMap);

  const resetCircles = useCallback(() => {
    props.onClearCircles?.();
  }, [props.onClearCircles]);

  const onSquareRightClick = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowAndCircleColor]);
    },
    [onCircleDraw, arrowAndCircleColor]
  );

  // Moves

  const [pendingMove, setPendingMove] = useState<ChessBoardPendingMove>();
  const [promoMove, setPromoMove] = useState<ShortChessMove>();

  const [preMove, setPreMove] = useState<ChessboardPreMove>();
  const prevTurn = useRef(turn);
  useEffect(() => {
    if (!onPremove) {
      return;
    }

    // Only call this when the turn actually changes
    if (prevTurn.current === turn) {
      return;
    }

    if (preMove && preMove.to) {
      const { to } = preMove;

      setTimeout(() => {
        setPreMove(undefined);
        onPremove({ ...preMove, to });
      }, 1 * 250);
    }

    prevTurn.current = turn;
  }, [turn, preMove, onPremove]);

  // TODO: This is only a HACK until the library implements the square/piece in the onClick Handlers
  const fenBoardInstance = useInstance<ChessFENBoard>(new ChessFENBoard(fen));
  useEffect(() => {
    fenBoardInstance.loadFen(fen);

    // Clear the pending Move if the Fen has changed (by opponent)
    setPendingMove(undefined);
  }, [fen]);

  const onSquareTouch = (square: Square) => {
    if (!onMove) {
      return;
    }

    // TODO: Remove this as now the board natively supports the piece
    const piece = invoke(() => {
      const _pieceSan = fenBoardInstance.piece(square);

      if (!_pieceSan) {
        return undefined;
      }

      return fenBoardPieceSymbolToDetailedChessPiece(_pieceSan);
    });

    const isMyPiece = piece?.color === boardOrientation;

    // Only allow the pieces of the same color as the board orientation to be touched
    if (!pendingMove && strict && !isMyPiece) {
      return;
    }

    // Premoves
    // if (!isMyTurn) {
    //   if (isMyPiece && !preMove) {
    //     setPreMove({ from: square, piece });
    //   } else if (preMove) {
    //     setPreMove({
    //       ...preMove,
    //       to: square,
    //     });
    //   }
    // }

    // If there is no existent Pending Move ('from' set)
    if (!pendingMove?.from) {
      // If the square isn't a piece return early
      if (!piece) {
        return;
      }

      setPendingMove({ from: square, piece });
      return;
    }

    // If there is an existent Pending Move ('from' set), but no '`to' set
    if (!pendingMove?.to) {
      // setPromoMove(undefined);

      // Return early if the from and to square are the same
      if (square === pendingMove.from) {
        setPendingMove(undefined);
        return;
      }

      // Simply change the pending moves if the same side
      if (piece?.color === pendingMove.piece.color) {
        setPendingMove({
          piece,
          from: square,
        });
        return;
      }

      if (
        isPromotableMove(
          { from: pendingMove.from, to: square },
          pendingMove.piece
        ) &&
        canMove({
          from: pendingMove.from,
          // color: pendingMove.piece.color,
          to: square,
          promoteTo: 'q',
        })
      ) {
        // Set the Promotion Move
        setPromoMove({
          ...pendingMove,
          to: square,
        });
        return;
      }

      // onMove can only be called if canMove returns true!
      if (
        !canMove({
          from: pendingMove.from,
          to: square,
          // color: pendingMove.piece.color,
        })
      ) {
        return;
      }

      const isValid = onMove({
        from: pendingMove.from,
        to: square,
      });

      if (isValid) {
        setPendingMove(undefined);
      }
    }
  };

  const isMyTurn = boardOrientation === turn;

  // Styles
  const customStyles = useCustomStyles({
    boardTheme,
    fen,
    lastMove,
    pendingMove,
    preMove,
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
      // promo move
      promoMove={promoMove}
      onCancelPromoMove={() => setPromoMove(undefined)}
      onSubmitPromoMove={(s) => onMove?.(s)}
      // others
      rightSideClassName={rightSideClassName}
      rightSideComponent={rightSideComponent}
      rightSideSizePx={rightSideSizePx}
      overlayComponent={overlayComponent}
      // board props
      customBoardStyle={customStyles.customBoardStyle}
      customLightSquareStyle={customStyles.customLightSquareStyle}
      customDarkSquareStyle={customStyles.customDarkSquareStyle}
      customSquareStyles={customStyles.customSquareStyles}
      customSquare={ChessboardSquare}
      onPieceDragBegin={(_, b) => onSquareTouch(b)}
      onMouseOverSquare={setHoveredSquare}
      {...(onMove && {
        onPieceDrop: (from, to, pieceSan) => {
          if (circlesMap && Object.keys(circlesMap).length > 0) {
            resetCircles();
          }
          onPieceDrop(from, to, pieceSan);

          setPendingMove(undefined);

          if (isPromotableMove({ from, to }, pieceSanToPiece(pieceSan))) {
            // Set the Promotion Move
            setPromoMove({
              from,
              to,
              // piece: pieceSan,
            });
            return true;
          } else {
            return !!onMove({ from, to });
          }
        },
      })}
      onSquareClick={(sq) => {
        onSquareTouch(sq);

        // Reset the Arrows and Circles if present
        if (circlesMap && Object.keys(circlesMap).length > 0) {
          resetCircles();
        }

        if (props.arrowsMap && Object.keys(props.arrowsMap).length > 0) {
          // Reset the arrows on square click
          onArrowsChange?.({});
        }
      }}
      customArrowColor={arrowAndCircleColor}
      customArrows={customArrows.arrowsToRender}
      onArrowsChange={customArrows.updateArrowsMap}
      onSquareRightClick={onSquareRightClick}
      customPieces={boardTheme.customPieces}
      {...props}
    />
  );
};
