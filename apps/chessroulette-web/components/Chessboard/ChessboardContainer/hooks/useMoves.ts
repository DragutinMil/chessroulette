import { useEffect, useState, useRef } from 'react';
import type {
  ChessBoardPendingMove,
  ChessboardPreMove,
  ChessboardShortMoveWithPiece,
} from '../types';
import {
  PieceSan,
  ShortChessColor,
  ShortChessMove,
  isPromotableMove,
  pieceSanToPiece,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import { Err, Ok, Result } from 'ts-results';

type MoveActions = {
  onSquareClick: (square: Square, pieceSan?: PieceSan) => void;
  onPieceDrag: (square: Square,pieceSan: PieceSan) => void;
  onPieceDrop: (from: Square, to: Square, pieceSan: PieceSan) => boolean;
  onClearPromoMove: () => void;
  onPromoSubmit: (move: ShortChessMove) => void; // Add this line
  promoMove: ShortChessMove | undefined;
  preMove: ChessboardPreMove | undefined;
  pendingMove: ChessBoardPendingMove | undefined;
};

type PlayerMoves = {
  pendingMove: ChessBoardPendingMove | undefined;
  preMove: ChessboardPreMove | undefined;
};

type PlayerMovesState = {
  white: PlayerMoves;
  black: PlayerMoves;
};

type Props = {
  isMyTurn: boolean;
  // This is the color than can move the pieces
  playingColor: ShortChessColor;

  // This is needed in order for the board animation to not get choppy
  premoveAnimationDelay?: number;
  isSquareEmpty: (m: string) => boolean;
  onMove: (m: ShortChessMove) => void;
  onPreMove?: (m: ShortChessMove) => void;
  onValidateMove: (m: ShortChessMove) => boolean;
  onValidatePreMove: (m: ShortChessMove) => boolean;
  onSquareClickOrDrag?: () => void;
};

export const useMoves = ({
  isMyTurn,
  playingColor,
  premoveAnimationDelay = 100,
  onMove,
  onPreMove,
  onValidateMove,
  isSquareEmpty,
  onValidatePreMove,
  onSquareClickOrDrag,
}: Props): MoveActions => {
  const [playerMoves, setPlayerMoves] = useState<PlayerMovesState>({
    white: { pendingMove: undefined, preMove: undefined },
    black: { pendingMove: undefined, preMove: undefined },
  });

  const [promoMove, setPromoMove] = useState<ShortChessMove>();
  const [isPromoFromPreMove, setIsPromoFromPreMove] = useState(false); // Dodaj ovu liniju

  const [lastMoveWasPromotion, setLastMoveWasPromotion] = useState(false); // Dodajte ovo

  //const [premoveAnimationDelay] = useState(300);
  // pre move
  const allowsPremoves = !!onPreMove;

  const currentPlayer = playingColor === 'w' ? 'white' : 'black';
  const getCurrentMoves = () => playerMoves[currentPlayer];

  const setPreMove = (move: ChessboardPreMove | undefined) => {
    setPlayerMoves((prev) => ({
      ...prev,
      [currentPlayer]: {
        ...prev[currentPlayer],
        preMove: move,
      },
    }));
  };

  const setPendingMove = (move: ChessBoardPendingMove | undefined) => {
    setPlayerMoves((prev) => ({
      ...prev,
      [currentPlayer]: {
        ...prev[currentPlayer],
        pendingMove: move,
      },
    }));
  };
 

  const onClickOrDrag = ({
    square,
    pieceSan,
  }: {
    square: Square;
    pieceSan?: PieceSan;
  }) => {
   
    const piece = pieceSan ? pieceSanToPiece(pieceSan) : undefined;
    const isMyPiece = piece?.color === playingColor;
    const currentMoves = getCurrentMoves();
    // Handle regular moves during my turn
   
    if (isMyTurn && !currentMoves.preMove) {
      // If no pending move exists
     
      if (!currentMoves.pendingMove?.from) {
        if (!isMyPiece) {
          return;
        }

        setPendingMove({ from: square, piece });
        return;
      }
      // If we have a pending move without destination
      if (!currentMoves.pendingMove.to) {
        // Deselect if same square
        if (square === currentMoves.pendingMove.from) {
          setPendingMove(undefined);
          return;
        }
        // Change selection if clicking another of my pieces
        if (piece?.color === currentMoves.pendingMove.piece.color) {
          setPendingMove({
            piece,
            from: square,
          });
          return;
        }
        // Check for promotion
       
        if (
          isValidPromoMove({
            ...currentMoves.pendingMove,
            to: square,
          })
        ) {
         
          setPromoMove({ ...currentMoves.pendingMove, to: square });
          setIsPromoFromPreMove(false);
          return;
        }
        // Regular move
        const moveAttempt = { from: currentMoves.pendingMove.from, to: square };
        onMoveIfValid(moveAttempt).map(() => {
          setPendingMove(undefined);
        });
      }
    }
    ///MOJ POTEZ I IMAM PREMOVE

    if (isMyTurn && currentMoves.preMove) {
      
      // Case 3 & 4: Complete premove that was started earlier
      if (!currentMoves.preMove.to) {
        if (square === currentMoves.preMove.from) {
          // Cancel premove if clicking same square
          setPreMove(undefined);
          return;
        }
        if (piece && isMyPiece) {
          setPreMove({ from: square, piece });
          return;
        }

        // Complete the premove as a regular move
        const moveAttempt = {
          from: currentMoves.preMove.from,
          to: square,
          piece: currentMoves.preMove.piece,
        };

        // Check for promotion
        if (isValidPromoMove(moveAttempt)) {
          setPreMove({ ...currentMoves.preMove, to: square });

          return;
        }
        // Try regular move
        onMoveIfValid(moveAttempt).map(() => {
          setPreMove(undefined);
        });
        return;
      }
    }

    ///PREMOVE
    // First handle premoves during opponent's turn

    if (allowsPremoves && !isMyTurn) {
     
      // Case 1: Click on my piece to start premove
      // Case 4: Drag my piece to start premove
      if (!currentMoves.preMove && piece && isMyPiece) {
        setPreMove({ from: square, piece });

        return;
      }

      if (currentMoves.preMove) {
        // Cancel premove if clicking same square
        if (currentMoves.preMove.from === square) {
          setPreMove(undefined);
          return;
        }

        // Case 2: Complete premove by clicking destination
        if (!piece || piece.color !== playingColor) {
          const completedPreMove = {
            ...currentMoves.preMove,
            to: square,
          };

          // Proveri da li je promocija
          const moveAttempt = {
            from: completedPreMove.from,
            to: square,
            piece: completedPreMove.piece,
          };

          // if (isValidPromoMove(moveAttempt)) {
      
          //   setPreMove(completedPreMove);
          //   return;
          // }

          if (
            onValidatePreMove({
              from: completedPreMove.from,
              to: completedPreMove.to,
            }) === false &&
            !isPromotableMove(moveAttempt, moveAttempt.piece)
          ) {
            setPreMove(undefined);
            return;
          }

          setPreMove(completedPreMove);
          return;
        }

        // Change premove piece if clicking different piece
        if (piece && isMyPiece) {
          setPreMove({ from: square, piece });
          return;
        }
      }
    }

    // Clear premove if it's my turn and premove is complete
    //   if (isMyTurn && currentMoves.preMove?.to) {
    //     setPreMove(undefined);
    //   }
  };

  useEffect(() => {
    if (!onPreMove) {
      return;
    }
    if (!isMyTurn) {
      return;
    }

    const currentMoves = getCurrentMoves();

    if (promoMove) {
      if (isSquareEmpty(promoMove.to)) {
        if (promoMove.to[0] == promoMove.from[0]) {
          return;
        } else {
          setPromoMove(undefined);
        }
      } else {
        if (promoMove.to[0] == promoMove.from[0]) {
          setPromoMove(undefined);
        }
      }
      //Skipping premove execution promoMove is waiting for user selection
    }

    // If we have a complete premove and it's our turn, execute it
    if (isMyTurn && currentMoves.preMove?.to) {
      const moveToExecute = {
        from: currentMoves.preMove.from,
        to: currentMoves.preMove.to,
        piece: currentMoves.preMove.piece,
      };

      const isPromotion = isPromotableMove(moveToExecute, moveToExecute.piece);

      if (isPromotion) {
        // Postavi promoMove i čekaj korisnikov izbor figure
        const promoMoveToSet = {
          from: currentMoves.preMove.from,
          to: currentMoves.preMove.to,
        };
        setPromoMove(promoMoveToSet);
        setIsPromoFromPreMove(true);
        setPreMove(undefined);
        return;
      }
      // Ako nije promocija, izvrši premove direktno
      setTimeout(() => {
        onMove(moveToExecute);
        setPreMove(undefined);
      }, premoveAnimationDelay);
    }
  }, [isMyTurn, promoMove]);

  const onMoveIfValid = (m: ShortChessMove): Result<void, void> => {
    if (onValidateMove(m)) {
      onMove(m);
      return Ok.EMPTY;
    }
    return Err.EMPTY;
  };

  const isValidPromoMove = (m: ChessboardShortMoveWithPiece) =>
    isPromotableMove(m, m.piece) &&
    onValidateMove({
      ...m,
      promoteTo: 'q',
    });

  const onPieceDrop = (from: Square, to: Square, pieceSan: PieceSan) => {
   
    const currentMoves = getCurrentMoves();
    const piece = pieceSanToPiece(pieceSan);
   
    console.log('ide drop', from, to, pieceSan);
    // Case 1: Complete premove by dragging to destination
    if (!isMyTurn && allowsPremoves) {
       console.log('Complete premove by dragging to destination',from, to, pieceSan);
      if (piece.color === playingColor) {
        if (currentMoves.preMove) {
          if (from !== currentMoves.preMove.from) {
             console.log('Complete premove by dragging 1',from, to, pieceSan);
            setPreMove({ from, piece });
            return false;
          }

          const moveAttempt = {
            from: currentMoves.preMove.from,
            to,
            piece: currentMoves.preMove.piece,
          };
          if (
            onValidatePreMove({
              from: currentMoves.preMove.from,
              to: moveAttempt.to,
            }) === false &&
            !isPromotableMove(moveAttempt, moveAttempt.piece) &&
            isSquareEmpty(to)
          ) {
            setPreMove(undefined);
            return false;
          }
           console.log('Complete existing premove',from, to, pieceSan);
          // Complete existing premove
          setPreMove({ ...currentMoves.preMove, to });
        } else {
          if (
            onValidatePreMove({ from: from, to: to }) === false &&
            isSquareEmpty(to)
          ) {
            console.log('Complete premove by dragging else',from, to, pieceSan);
            setPreMove(undefined);
            return false;
          } else {
            console.log('Complete premove by dragging else 2',from, to, pieceSan);
            setPreMove({ from, to, piece });
          }
          // Start new premove

          //  logMove('Start premove by drag', { from, piece });
        }
        return false;
      }
    }

    // Case 3 & 4: Complete premove that was started earlier
    if (isMyTurn && currentMoves.preMove && !currentMoves.preMove.to) {
      console.log('Complete premove that was started earlier',from, to, pieceSan);
      if (from !== currentMoves.preMove.from) {
        console.log('Complete premove that was started earlier 2',from, to, pieceSan);
        setPreMove(undefined);

        if (isValidPromoMove({ from, to, piece })) {
          setPreMove({ from, piece, to });
          return true;
        }
        console.log('Complete premove that was started earlier 3',from, to, pieceSan);
        return onMoveIfValid({ from, to }).ok;
      }
      const moveAttempt = {
        from: currentMoves.preMove.from,
        to,
        piece: currentMoves.preMove.piece,
      };

      if (isValidPromoMove(moveAttempt)) {
          console.log('Complete premove that was started earlier 4',from, to, pieceSan);
        setPreMove({ ...currentMoves.preMove, to });
        return true;
      }

      const result = onMoveIfValid(moveAttempt);
      if (result.ok) {
          console.log('Complete premove that was started earlier 5',from, to, pieceSan);
        setPreMove(undefined);
      }
      return result.ok;
    }
    // Handle regular moves during player's turn
    // If there's a pending move and we're dragging a different piece,
    // cancel the pending move and try the new move instead
    if (
      isMyTurn &&
      currentMoves.pendingMove &&
      from !== currentMoves.pendingMove.from
    ) {
        console.log('Complete premove that was started earlier 6',from, to, pieceSan);
      setPendingMove(undefined);
    }
   

    console.log('dolazi do provere', from, to, piece);
    if (isValidPromoMove({ from, to, piece })) {
      console.log('liki',from, to, piece);
      setPromoMove({ from, to });
      setIsPromoFromPreMove(false);
      setPendingMove(undefined); // PREMEŠTI OVDE
      return true;
    }

    setPendingMove(undefined); // PREMEŠTI OVDE
      console.log('kraj',from, to, pieceSan);
    return onMoveIfValid({ from, to }).ok;
  };

  // Fix the return object (remove ...moveActions since it doesn't exist)
  return {
    onSquareClick: (square: Square, pieceSan?: PieceSan) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrag: (square: Square,pieceSan: PieceSan) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrop,
    onPromoSubmit: (move: ShortChessMove) => {
      // Kada korisnik izabere figuru, prosleđujemo move sa promoteTo
      if (isPromoFromPreMove && onPreMove) {
        onPreMove(move);
      } else {
        onMove(move);
      }
      setPromoMove(undefined);
      setIsPromoFromPreMove(false);
    },
    onClearPromoMove: () => {
      setPromoMove(undefined), setIsPromoFromPreMove(false);
    },
    promoMove,
    preMove: getCurrentMoves().preMove,
    pendingMove: getCurrentMoves().pendingMove,
  };
};
