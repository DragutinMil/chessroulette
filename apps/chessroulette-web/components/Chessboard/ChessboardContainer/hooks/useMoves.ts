import { useEffect, useState } from 'react';
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
  onPieceDrag: (pieceSan: PieceSan, square: Square) => void;
  onPieceDrop: (from: Square, to: Square, pieceSan: PieceSan) => boolean;
  onClearPromoMove: () => void;
  onPromoSubmit: (move: ShortChessMove) => void;  // Add this line
  promoMove: ShortChessMove | undefined;
  preMove: ChessboardPreMove | undefined;
  pendingMove: ChessBoardPendingMove | undefined;
};

type PlayerPendingMove = {
  white: ChessBoardPendingMove | undefined;
  black: ChessBoardPendingMove | undefined;
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

  onMove: (m: ShortChessMove) => void;
  onPreMove?: (m: ShortChessMove) => void;
  onValidateMove: (m: ShortChessMove) => boolean;

  onSquareClickOrDrag?: () => void;
};

export const useMoves = ({
  isMyTurn,
  playingColor,
  premoveAnimationDelay = 100,
  onMove,
  onPreMove,
  onValidateMove,
  onSquareClickOrDrag,
}: Props): MoveActions => {
  const [playerMoves, setPlayerMoves] = useState<PlayerMovesState>({
    white: { pendingMove: undefined, preMove: undefined },
    black: { pendingMove: undefined, preMove: undefined },
  });

  const [promoMove, setPromoMove] = useState<ShortChessMove>();
  const [isPromoFromPreMove, setIsPromoFromPreMove] = useState(false);  // Dodaj ovu liniju

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

  // Debug logging
  const logMove = (action: string, data: any) => {
    // console.log(`[ChessMove][${playingColor}] ${action}:`, {
    //   ...data,
    //   currentMoves: getCurrentMoves(),
    //   isMyTurn,
    // });
  };

  const onClickOrDrag = ({
    square,
    pieceSan,
  }: {
    square: Square;
    pieceSan?: PieceSan;
  }) => {
    onSquareClickOrDrag?.();

    const piece = pieceSan ? pieceSanToPiece(pieceSan) : undefined;
    const isMyPiece = piece?.color === playingColor;
    const currentMoves = getCurrentMoves();

    logMove('Click/Drag', {
      square,
      pieceSan,
      isMyPiece,
      currentMoves,
    });

    // First handle premoves during opponent's turn
    if (allowsPremoves && !isMyTurn) {
      // Case 1: Click on my piece to start premove
      // Case 4: Drag my piece to start premove
      if (!currentMoves.preMove && piece && isMyPiece) {
        setPreMove({ from: square, piece });
        logMove('Start premove', { square, piece });
        return;
      }

      if (currentMoves.preMove) {
        // Cancel premove if clicking same square
        if (currentMoves.preMove.from === square) {
          setPreMove(undefined);
          logMove('Cancel premove', { square });
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
          
          if (isValidPromoMove(moveAttempt)) {
            // Ne postavljaj premove sa to, već odmah postavi promoMove
            // Dialog će se prikazati kada dođe na red
            setPreMove(completedPreMove); // Sačuvaj premove za kasnije
            logMove('Complete premove with promotion', moveAttempt);
            return;
          }
          
          setPreMove(completedPreMove);
          logMove('Complete premove by click', {
            from: currentMoves.preMove.from,
            to: square,
          });
          return;
        }

        // Change premove piece if clicking different piece
        if (piece && isMyPiece) {
          setPreMove({ from: square, piece });
          logMove('Change premove piece', { square, piece });
          return;
        }
      }
    }

    if (isMyTurn && currentMoves.preMove) {
      // Case 3 & 4: Complete premove that was started earlier
      if (!currentMoves.preMove.to) {
        if (square === currentMoves.preMove.from) {
          // Cancel premove if clicking same square
          setPreMove(undefined);
          logMove('Cancel pending premove', { square });
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
          //setPromoMove(moveAttempt);
          //setIsPromoFromPreMove(true);
          //setPreMove(undefined);
          //logMove('Set promotion from premove', moveAttempt);
          
          setPreMove({ ...currentMoves.preMove, to: square });
          logMove('Complete premove with promotion - will execute on turn', moveAttempt);
          
          return;
        }

        // Try regular move
        onMoveIfValid(moveAttempt).map(() => {
          logMove('Execute premove as regular move', moveAttempt);
          setPreMove(undefined);
        });
        return;
      }
    }

    // Handle incomplete premove completion during my turn
    if (isMyTurn && currentMoves.preMove && !currentMoves.preMove.to) {
      if (square === currentMoves.preMove.from) {
        // Cancel premove if clicking same square
        setPreMove(undefined);
        logMove('Cancel premove on my turn', { square });
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
        //setPromoMove(moveAttempt);
        //setIsPromoFromPreMove(true);
        //setPreMove(undefined);
        //logMove('Set promotion from premove', moveAttempt);
                setPreMove({ ...currentMoves.preMove, to: square });
        logMove('Complete premove with promotion - will execute on turn', moveAttempt);
        return;
      }

      // Try regular move
      onMoveIfValid(moveAttempt).map(() => {
        logMove('Execute premove as regular move', moveAttempt);
        setPreMove(undefined);
      });
      return;
    }

    // Clear premove if it's my turn and premove is complete
 //   if (isMyTurn && currentMoves.preMove?.to) {
 //     setPreMove(undefined);
 //   }

    // Handle regular moves during my turn
    if (isMyTurn) {
      // If no pending move exists
      if (!currentMoves.pendingMove?.from) {
        if (!isMyPiece) {
          logMove('Invalid piece selection', { square });
          return;
        }
        setPendingMove({ from: square, piece });
        logMove('Select piece', { square, piece });
        return;
      }

      // If we have a pending move without destination
      if (!currentMoves.pendingMove.to) {
        // Deselect if same square
        if (square === currentMoves.pendingMove.from) {
          setPendingMove(undefined);
          logMove('Deselect piece', { square });
          return;
        }

        // Change selection if clicking another of my pieces
        if (piece?.color === currentMoves.pendingMove.piece.color) {
          setPendingMove({
            piece,
            from: square,
          });
          logMove('Change piece selection', { square, piece });
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
          logMove('Set promotion', {
            from: currentMoves.pendingMove.from,
            to: square,
          });
          return;
        }

        // Regular move
        const moveAttempt = { from: currentMoves.pendingMove.from, to: square };
        logMove('Attempt regular move', moveAttempt);

        onMoveIfValid(moveAttempt).map(() => {
          logMove('Move executed', moveAttempt);
          setPendingMove(undefined);
        });
      }
    }
  };
    // If we have a complete premove and it's our turn, execute it
    useEffect(() => {
      const currentMoves = getCurrentMoves();
  
      logMove('Turn changed', {
        currentMoves,
        isMyTurn,
      });

      if (promoMove) {
        logMove('Skipping premove execution promoMove is waiting for user selection',
           promoMove);
        return;
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
          console.log('[useMoves] Setting promoMove from premove - waiting for user selection:', promoMoveToSet);
          setPromoMove(promoMoveToSet);
          setIsPromoFromPreMove(true);
          setPreMove(undefined);
          logMove('Set promotion from complete premove - waiting for user', moveToExecute);
          // VAŽNO: Ne pozivaj onMove ovde - čekaj da korisnik izabere figuru
          return;
        }
  
        // Ako nije promocija, izvrši premove direktno
        setTimeout(() => {
          onMove(moveToExecute);
          setPreMove(undefined);
        }, premoveAnimationDelay);
      }
    }, [isMyTurn, playerMoves, premoveAnimationDelay, promoMove]);

  useEffect(() => {
    const currentMoves = getCurrentMoves();
    logMove('State updated', {
      pendingMove: currentMoves.pendingMove,
      preMove: currentMoves.preMove,
      isMyTurn,
      playingColor,
    });
  }, [playerMoves, isMyTurn]);

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

    logMove('Piece drop', { from, to, pieceSan });

    // Case 1: Complete premove by dragging to destination
    if (!isMyTurn && allowsPremoves) {
      if (piece.color === playingColor) {
        if (currentMoves.preMove) {
          if (from !== currentMoves.preMove.from) {
            setPreMove({ from, piece });
            logMove('Change premove piece by drag', { from, piece });
            return false;
          }
          // Complete existing premove
          setPreMove({ ...currentMoves.preMove, to });
          logMove('Complete premove by drag', {
            from: currentMoves.preMove.from,
            to,
          });
        } else {
          // Start new premove
          setPreMove({ from, piece });
          logMove('Start premove by drag', { from, piece });
        }
        return false;
      }
    }

    // Case 3 & 4: Complete premove that was started earlier
    if (isMyTurn && currentMoves.preMove && !currentMoves.preMove.to) {
      if (from !== currentMoves.preMove.from) {
        setPreMove(undefined);

        if (isValidPromoMove({ from, to, piece })) {
          setPreMove({ from, piece, to });
          return true;
        }
        return onMoveIfValid({ from, to }).ok;
      }
      const moveAttempt = {
        from: currentMoves.preMove.from,
        to,
        piece: currentMoves.preMove.piece,
      };

      if (isValidPromoMove(moveAttempt)) {
        setPreMove({ ...currentMoves.preMove, to });
        return true;
      }

      const result = onMoveIfValid(moveAttempt);
      if (result.ok) {
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
      setPendingMove(undefined);
    }

    if (isValidPromoMove({ from, to, piece })) {
      setPromoMove({ from, to });
      setIsPromoFromPreMove(false); 
      setPendingMove(undefined);  // PREMEŠTI OVDE
      return true;
    }

    setPendingMove(undefined);  // PREMEŠTI OVDE
    return onMoveIfValid({ from, to }).ok;
  };

  // Fix the return object (remove ...moveActions since it doesn't exist)
  return {
    onSquareClick: (square: Square, pieceSan?: PieceSan) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrag: (pieceSan: PieceSan, square: Square) =>
      onClickOrDrag({ square, pieceSan }),
    onPieceDrop,
    onPromoSubmit: (move: ShortChessMove) => {
      console.log('[useMoves] onPromoSubmit called with move:', move, 'isPromoFromPreMove:', isPromoFromPreMove);
      // Kada korisnik izabere figuru, prosleđujemo move sa promoteTo
      if (isPromoFromPreMove && onPreMove) {
        console.log('[useMoves] Calling onPreMove with promotion:', move);
        onPreMove(move);
      } else {
        console.log('[useMoves] Calling onMove with promotion:', move);
        onMove(move);
      }
      setPromoMove(undefined);
      setIsPromoFromPreMove(false); 
    },
    onClearPromoMove: () => 
    {setPromoMove(undefined),
    setIsPromoFromPreMove(false); 
    },
    promoMove,
    preMove: getCurrentMoves().preMove,
    pendingMove: getCurrentMoves().pendingMove,
  };
};