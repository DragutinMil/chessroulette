import { useMemo } from 'react';
import { getInCheckSquareMap } from '../util';
import { BoardTheme } from '@app/hooks/useTheme/defaultTheme';
import { ChessFEN, ShortChessMove, toDictIndexedBy } from '@xmatter/util-kit';
import {
  ChessboardPreMove,
  ChessBoardPendingMove,
  ReactChessBoardProps,
} from '../types';
import { Square } from 'chess.js';
import { CirclesMap } from '../../types';
import { objectKeys } from 'movex-core-util';
import { deepmerge } from 'deepmerge-ts';

export const useCustomStyles = ({
  boardTheme,
  fen,
  lastMove,
  pendingMove,
  preMove,
  circlesMap,
  isMyTurn,
  hoveredSquare,
}: {
  boardTheme: BoardTheme;
  fen: ChessFEN;
  lastMove?: ShortChessMove;
  pendingMove?: ChessBoardPendingMove;
  preMove?: ChessboardPreMove;
  circlesMap?: CirclesMap;
  isMyTurn?: boolean;
  hoveredSquare?: Square;
}) => {
  const inCheckSquares = useMemo(() => getInCheckSquareMap(fen), [fen]);

  const mergedCustomSquareStyles = useMemo(() => {
    //
    // Last move highlight
    //
    const lastMoveStyles = lastMove && {
      [lastMove.from]: {
        background: boardTheme.lastMoveFromSquare,
      },
      [lastMove.to]: {
        background: boardTheme.lastMoveToSquare,
      },
    };

    // const circledStyles =
    //   circlesMap &&
    //   toDictIndexedBy(
    //     Object.values(circlesMap),
    //     ([sq]) => sq,
    //     ([_, hex]) => ({
    //       position: 'relative',
    //       '> .circleDiv': {
    //         position: 'absolute',
    //         inset: 0,
    //         background: `radial-gradient(ellipse at center,
    //             rgba(255,113,12,0) 60%,
    //             ${hex} 51.5%)`,
    //         borderRadius: '50%',
    //       },
    //     })
    //   );
    const circledStyles = circlesMap
      ? toDictIndexedBy(
          Object.values(circlesMap),
          ([sq]) => sq,
          ([_, hex]) => ({
            borderRadius: '50%',
            background: `radial-gradient(circle at center, rgba(255,113,12,0) 60%, ${hex} 51.5%)`,
          })
        )
      : {};

    const inCheckStyles =
  inCheckSquares &&
  toDictIndexedBy(
    objectKeys(inCheckSquares),
    (sq) => sq,
    () => ({
      backgroundColor: 'rgb(242, 53, 141,0.8)',
      boxShadow: '0 0 20px rgb(242, 53, 141,0.8) inset',
      borderRadius:'50%',
     
     // height:'90%'
    })
  );

    const pendingStyles = pendingMove?.from && {
      [pendingMove.from]: {
        background: boardTheme.clickedPieceSquare,
      },
    };

    const hoveredStyles = isMyTurn &&
      pendingMove &&
      hoveredSquare &&
      hoveredSquare !== pendingMove.from && {
        [hoveredSquare]: {
          background: boardTheme.clickedPieceSquare,
        },
      };

    const premoveStyles = preMove && {
      [preMove.from]: {
        background: boardTheme.preMoveFromSquare,
      },
      ...(preMove.to && {
        [preMove.to]: {
          background: boardTheme.preMoveToSquare,
        },
      }),
    };

    return deepmerge(
      lastMoveStyles || {},
      circledStyles || {},
      inCheckStyles || {},

      pendingStyles || {},
      hoveredStyles || {},
      premoveStyles || {}
    );
  }, [
    lastMove,
    circlesMap,
    inCheckSquares,
    boardTheme,
    hoveredSquare,
    pendingMove?.from,
    isMyTurn,
    preMove,
  ]);

  return useMemo(
    () => ({
      squareStyles: mergedCustomSquareStyles,
    }),
    [mergedCustomSquareStyles]
  );
};
