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
  hintSquares,
  hintFromSquare,
  glowSquare,
}: {
  boardTheme: BoardTheme;
  fen: ChessFEN;
  lastMove?: ShortChessMove;
  pendingMove?: ChessBoardPendingMove;
  preMove?: ChessboardPreMove;
  circlesMap?: CirclesMap;
  isMyTurn?: boolean;
  hoveredSquare?: Square;
  hintSquares?: Square[];
  hintFromSquare?: Square;
  glowSquare?: Square;
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
          background: 'rgb(242, 53, 141,0.8)',
          boxShadow: '0 0 20px rgb(242, 53, 141,0.8) inset',
          borderRadius: '50%',

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

    // Mala tackica na sredini polja - "ovde ova figura moze da ode" (npr.
    // DailyLesson-ov "wrong move" hint, umesto strelica).
    const hintDotStyles = hintSquares?.length
      ? toDictIndexedBy(
          hintSquares,
          (sq) => sq,
          () => ({
            backgroundImage:
              'radial-gradient(circle, rgba(7,218,99,0.65) 22%, transparent 23%)',
          })
        )
      : {};

    // Okvir (ne fil) oko figure na koju se hint odnosi - "ovu figuru pomeri".
    // Plava (#11c6d1, ista kao strelice) namerno, ne zelena - da se ne stopi
    // sa zelenim "last move" highlight-om kad je bas ta figura upravo odigrana.
    const hintFromStyles = hintFromSquare && {
      [hintFromSquare]: {
        boxShadow: 'inset 0 0 0 3px #11c6d1',
      },
    };

    // Kratak zlatni "glow" - DailyLesson-ov skakac koji preskace figuru
    // (Knight lekcija, "jump over" primer) - vidno se razlikuje od plavog
    // hinta i zelenog last-move highlight-a.
    const glowStyles = glowSquare && {
      [glowSquare]: {
        boxShadow: '0 0 0 3px #FFD700, 0 0 14px 4px rgba(255,215,0,0.75) inset',
      },
    };

    return deepmerge(
      lastMoveStyles || {},
      circledStyles || {},
      inCheckStyles || {},

      pendingStyles || {},
      hoveredStyles || {},
      premoveStyles || {},
      hintFromStyles || {},
      glowStyles || {},
      hintDotStyles
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
    hintSquares,
    hintFromSquare,
    glowSquare,
  ]);

  return useMemo(
    () => ({
      squareStyles: mergedCustomSquareStyles,
    }),
    [mergedCustomSquareStyles]
  );
};
