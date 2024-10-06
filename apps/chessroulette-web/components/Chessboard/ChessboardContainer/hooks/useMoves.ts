import { useEffect, useRef, useState } from 'react';
import {
  ChessBoardPendingMove,
  ChessboardPreMove,
  ChessboardShortMoveWithPiece,
} from '../types';
import {
  ChessFEN,
  ChessFENBoard,
  PieceSan,
  ShortChessColor,
  ShortChessMove,
  isPromotableMove,
  pieceSanToPiece,
} from '@xmatter/util-kit';
import useInstance from '@use-it/instance';
import { Square } from 'chess.js';
import { invoke } from 'movex-core-util';

type Props = {
  fen: ChessFEN;
  turn?: ShortChessColor;
  isMyTurn: boolean;
  strict?: boolean;

  // This is the color than can move the pieces
  // playingColor: ShortChessColor;

  onMove: (m: ShortChessMove) => void;
  onValidateMove: (m: ShortChessMove) => boolean;

  onSquareClickOrDrag?: () => void;
};

export const useMoves = ({
  fen,
  turn,
  // isMyTurn,
  onMove,
  onValidateMove,
  onSquareClickOrDrag,
}: Props) => {
  const [pendingMove, setPendingMove] = useState<ChessBoardPendingMove>();
  const [promoMove, setPromoMove] = useState<ShortChessMove>();

  const [preMove, setPreMove] = useState<ChessboardPreMove>();
  const prevTurn = useRef(turn);
  // Come back to this one after the move and promo move are done
  // useEffect(() => {
  //   // if (!onPremove) {
  //   //   return;
  //   // }

  //   // Only call this when the turn actually changes
  //   if (prevTurn.current === turn) {
  //     return;
  //   }

  //   if (preMove && preMove.to) {
  //     const { to } = preMove;

  //     setTimeout(() => {
  //       setPreMove(undefined);
  //       onPremove({ ...preMove, to });
  //     }, 1 * 250);
  //   }

  //   prevTurn.current = turn;
  // }, [turn, preMove, onPremove]);

  // TODO: This is only a HACK until the library implements the square/piece in the onClick Handlers
  const fenBoardInstance = useInstance<ChessFENBoard>(new ChessFENBoard(fen));
  useEffect(() => {
    fenBoardInstance.loadFen(fen);

    // Clear the pending Move if the Fen has changed (by opponent)
    setPendingMove(undefined);
  }, [fen]);

  const isValidPromoMove = (m: ChessboardShortMoveWithPiece) =>
    isPromotableMove(m, m.piece) &&
    onValidateMove({
      ...m,
      promoteTo: 'q',
    });

  const onClickOrDrag = ({
    square,
    pieceSan,
  }: {
    square: Square;
    pieceSan?: PieceSan;
  }) => {
    console.log('on click or drag', square);
    onSquareClickOrDrag?.();

    // if (!onMove) {
    //   return;
    // }

    // TODO: Remove this as now the board natively supports the piece
    // const piece = invoke(() => {
    //   const _pieceSan = fenBoardInstance.piece(square);

    //   if (!_pieceSan) {
    //     return undefined;
    //   }

    //   return fenBoardPieceSymbolToDetailedChessPiece(_pieceSan);
    // });

    // const isMyPiece = piece?.color === boardOrientation;

    // removs the knoweledge of strictness here and my color only as that can be part of the move validator, that comes from the outside
    // Only allow the pieces of the same color as the board orientation to be touched
    // if (!pendingMove && strict && !isMyPiece) {
    //   return;
    // }

    // if (!pendingMove) {
    //   return;
    // }

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
    const piece = pieceSan ? pieceSanToPiece(pieceSan) : undefined;

    // If there is no existent Pending Move ('from' set)
    if (!pendingMove?.from) {
      // If the square isn't a piece return early
      if (!piece) {
        return;
      }

      setPendingMove({ from: square, piece });
      return;
    }

    // otherwise If there is an existent Pending Move without the 'to' set
    else if (!pendingMove?.to) {
      // Return early if the from and to square are the same
      if (square === pendingMove.from) {
        setPendingMove(undefined);
        return;
      }

      // Simply change the pending moves if the same side
      else if (piece?.color === pendingMove.piece.color) {
        setPendingMove({
          piece,
          from: square,
        });
        return;
      }

      // Check if Promo Move
      else if (
        isValidPromoMove({
          ...pendingMove,
          to: square,
        })
      ) {
        setPromoMove({ ...pendingMove, to: square });
        return;
      }

      // Otherwise it's a regular move
      else if (
        onValidateMove({
          from: pendingMove.from,
          to: square,
        })
      ) {
        onMove({
          from: pendingMove.from,
          to: square,
        });

        setPendingMove(undefined);

        return;
      }
    }
  };

  const onPieceDrop = (from: Square, to: Square, pieceSan: PieceSan) => {
    setPendingMove(undefined);

    // Check first if vald Promo Move
    if (isValidPromoMove({ from, to, piece: pieceSanToPiece(pieceSan) })) {
      setPromoMove({ from, to });
      return true;
    }

    // Otherwie simply move
    if (onValidateMove({ from, to })) {
      onMove({ from, to });

      return true;
    }

    return false;
  };

  return {
    onSquareClick: (square: Square, pieceSan?: PieceSan) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrag: (pieceSan: PieceSan, square: Square) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrop,
    onClearPromoMove: () => setPromoMove(undefined),
    promoMove,
    pendingMove,
  };
};
