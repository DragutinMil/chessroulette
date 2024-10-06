import {
  ChessFEN,
  ChessFENBoard,
  GetComponentProps,
  PieceSan,
  ShortChessMove,
  invoke,
  objectKeys,
  toChessArrowFromId,
  toChessArrowId,
  toDictIndexedBy,
  toLongColor,
  useCallbackIf,
  fenBoardPieceSymbolToDetailedChessPiece,
  isPromotableMove,
  pieceSanToPiece,
  promotionalPieceSanToFenBoardPromotionalPieceSymbol,
  ShortChessColor,
} from '@xmatter/util-kit';
import { Piece, Square } from 'chess.js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Chessboard } from 'react-chessboard';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { useArrowColor } from '../hooks/useArrowColor';
import { ArrowsMap, CircleDrawTuple, CirclesMap } from '../types';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { noop } from 'movex-core-util';
import { shallowEqualObjects } from 'shallow-equal';
import { deepmerge } from 'deepmerge-ts';
import { ChessboardSquare } from './ChessboardSquare';
import useInstance from '@use-it/instance';
import { getInCheckSquareMap } from './util';
import { BoardTheme } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { PromotionDialogLayer } from './PromotionDialogLayer';

export type ChessBoardProps = GetComponentProps<typeof Chessboard>;

export type ChessboardContainerProps = Omit<
  ChessBoardProps,
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
  onArrowsChange = noop,
  onCircleDraw = noop,
  onPieceDrop = noop,
  onMove,
  onPremove,
  canMove = () => true, // Defaults to always be able to move
  boardOrientation = 'w',
  containerClassName,
  customSquareStyles,
  rightSideComponent,
  rightSideSizePx = 0,
  rightSideClassName,
  boardTheme,
  sizePx,
  turn,
  ...props
}) => {
  const inCheckSquares = useMemo(() => getInCheckSquareMap(fen), [fen]);

  const customStyles = useMemo(
    () => ({
      customDarkSquareStyle: props.customDarkSquareStyle || {
        backgroundColor: boardTheme.darkSquare,
      },
      customLightSquareStyle: props.customLightSquareStyle || {
        backgroundColor: boardTheme.lightSquare,
      },
      customBoardStyle: props.customBoardStyle || { backgroundColor: 'white' },
    }),
    [
      props.customDarkSquareStyle,
      props.customLightSquareStyle,
      props.customBoardStyle,
    ]
  );

  const arrowColor = useArrowColor();
  const [localBoardArrowsMap, setLocalBoardArrowsMap] = useState<ArrowsMap>({});

  useDeepCompareEffect(() => {
    onArrowsChangeCb(localBoardArrowsMap);
  }, [localBoardArrowsMap]);

  const onArrowsChangeCb = useCallback(
    (nextLocalBoardArrowsMap: ArrowsMap) => {
      if (!onArrowsChange) {
        return;
      }

      if (!shallowEqualObjects(nextLocalBoardArrowsMap, props.arrowsMap)) {
        // Send them all outside
        onArrowsChange({
          ...props.arrowsMap,
          ...nextLocalBoardArrowsMap,
        });
      }
    },
    [onArrowsChange, props.arrowsMap, localBoardArrowsMap]
  );

  const arrowsToRender = useMemo(() => {
    return objectKeys(props.arrowsMap || {})
      .filter((a) => !Object(localBoardArrowsMap).hasOwnProperty(a))
      .map(toChessArrowFromId);
  }, [localBoardArrowsMap, props.arrowsMap]);

  const resetArrows = useCallback(() => {
    onArrowsChange({});
  }, [onArrowsChange]);

  const resetCircles = useCallback(() => {
    props.onClearCircles?.();
  }, [props.onClearCircles]);

  const onSquareRightClick = useCallback(
    (sq: Square) => {
      onCircleDraw([sq, arrowColor]);
    },
    [onCircleDraw, arrowColor]
  );

  const [safelyMounted, setSafelyMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setSafelyMounted(true);
    }, 250);
  }, []);

  const onArrowsChangeAfterMount = useCallbackIf(
    safelyMounted,
    (nextArrows: Arrow[]) => {
      if (
        nextArrows.length === 0 &&
        Object.keys(props.arrowsMap || {}).length > 0
      ) {
        // Reset when the arrows are set back to 0
        resetArrows();
        return;
      }

      return setLocalBoardArrowsMap(
        toDictIndexedBy(nextArrows, toChessArrowId)
      );
    },
    []
  );

  const [pendingMove, setPendingMove] = useState<{
    from: Square;
    piece: Piece;
    to?: Square;
  }>();

  const [preMove, setPreMove] = useState<{
    from: Square;
    piece: Piece;
    to?: Square;
  }>();

  const [promoMove, setPromoMove] = useState<ShortChessMove>();
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

  const [hoveredSquare, setHoveredSquare] = useState<Square>();

  const mergedCustomSquareStyles = useMemo(() => {
    const lastMoveStyle = lastMove && {
      [lastMove.from]: {
        background: boardTheme.lastMoveFromSquare,
      },
      [lastMove.to]: {
        background: boardTheme.lastMoveToSquare,
      },
    };

    const circledStyle =
      circlesMap &&
      toDictIndexedBy(
        Object.values(circlesMap),
        ([sq]) => sq,
        ([_, hex]) => ({
          position: 'relative',
          '> .circleDiv': {
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            background: `radial-gradient(ellipse at     center, 
              rgba(255,113,12,0) 60%,
              ${hex} 51.5%)`,
            borderRadius: '50%',
          },
        })
      );

    const checkedStyle =
      inCheckSquares &&
      toDictIndexedBy(
        objectKeys(inCheckSquares),
        (sq) => sq,
        () => ({
          position: 'relative',
          '> .inCheckDiv': {
            // content: `''`,
            position: 'absolute',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            background: 'red',
            borderRadius: '50%',
            opacity: 0.7,
          },
        })
      );

    const touchedSquareStyle = {
      ...(pendingMove?.from && {
        [pendingMove?.from]: {
          background: boardTheme.clickedPieceSquare,
        },
      }),
    };

    const hoveredSquareStyle = {
      ...(isMyTurn &&
        pendingMove &&
        hoveredSquare &&
        hoveredSquare !== pendingMove.from && {
          [hoveredSquare]: {
            background: boardTheme.clickedPieceSquare,
          },
        }),
    };

    const premoveSquaresStyle = {
      ...(preMove && {
        [preMove.from]: {
          background: boardTheme.preMoveFromSquare,
        },
        ...(preMove.to && {
          [preMove.to]: {
            background: boardTheme.preMoveToSquare,
          },
        }),
      }),
    };

    return deepmerge(
      lastMoveStyle || {},
      circledStyle || {},
      checkedStyle || {},
      customSquareStyles || {},
      touchedSquareStyle,
      hoveredSquareStyle,
      premoveSquaresStyle
    );
  }, [
    lastMove,
    circlesMap,
    sizePx,
    inCheckSquares,
    customSquareStyles,
    boardTheme,
    hoveredSquare,
    pendingMove?.from,
    isMyTurn,
    preMove,
  ]);

  if (sizePx === 0) {
    return null;
  }

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
        className={`relative overflow-hidden rounded-lg w-full h-full ${containerClassName}`}
        style={{
          width: sizePx,
          height: sizePx,
        }}
      >
        <Chessboard
          id="Chessboard" // TODO: should this be unique per instance?
          position={fen}
          boardWidth={sizePx}
          showBoardNotation
          boardOrientation={toLongColor(boardOrientation)}
          snapToCursor={false}
          arePiecesDraggable
          customBoardStyle={customStyles.customBoardStyle}
          customLightSquareStyle={customStyles.customLightSquareStyle}
          customDarkSquareStyle={customStyles.customDarkSquareStyle}
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
              resetArrows();
            }
          }}
          customSquareStyles={mergedCustomSquareStyles}
          customArrows={arrowsToRender}
          customArrowColor={arrowColor}
          onArrowsChange={onArrowsChangeAfterMount}
          onSquareRightClick={onSquareRightClick}
          customPieces={boardTheme.customPieces}
          {...props}
          // Take out the native promotion dialog out in favor of the custom one
          autoPromoteToQueen={false}
          onPromotionCheck={() => false}
        />

        {onMove && promoMove && (
          <PromotionDialogLayer
            boardSizePx={sizePx}
            promotionSquare={promoMove.to}
            boardOrientation={boardOrientation}
            renderPromotablePiece={boardTheme.renderPiece}
            onCancel={() => {
              setPromoMove(undefined);
            }}
            onPromotePiece={(p) => {
              onMove({
                ...promoMove,
                promoteTo:
                  promotionalPieceSanToFenBoardPromotionalPieceSymbol(p),
              });

              setPromoMove(undefined);
            }}
          />
        )}
        {props.overlayComponent && props.overlayComponent}
      </div>
      <div
        className={`w-full relative h-full ${rightSideClassName}`}
        style={{ width: rightSideSizePx }}
      >
        {rightSideComponent}
      </div>
    </div>
  );
};
