import {
  ChessArrowId,
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  ChessPGN,
  ChesscircleId,
  FenBoardPromotionalPieceSymbol,
  getNewChessGame,
  invoke,
  isValidPgn,
  pieceSanToFenBoardPieceSymbol,
  swapColor,
} from '@xmatter/util-kit';
import {
  ChessHistoryIndex_NEW,
  ChessHistoryMove_NEW,
  ChessHistory_NEW,
  ChessRecursiveHistory_NEW,
} from 'apps/chessroulette-web/components/GameHistory/history/types';
import {
  addMoveToChessHistory,
  decrementHistoryIndex,
  getHistoryLastIndex,
  getHistoryAtIndex,
  pgnToHistory,
  findMoveAtIndex,
  getHistoryNonMove,
  isLastHistoryIndexInBranch,
  incrementNestedHistoryIndex,
  findMoveAtIndexRecursively,
  renderHistoryIndex,
} from 'apps/chessroulette-web/components/GameHistory/history/util';
import { Action } from 'movex-core-util';
import { Square } from 'react-chessboard/dist/chessboard/types';

// type ParticipantId = string;

// type ChessRecursiveHistoryWithFen = (ChessRecursiveMove & { fen: ChessFEN })[];

export type ArrowDrawTuple = [from: Square, to: Square, hex?: string];
export type ArrowsMap = Record<ChessArrowId, ArrowDrawTuple>;

export type CircleDrawTuple = [at: Square, hex: string];
export type CirclesMap = Record<ChesscircleId, CircleDrawTuple>;

export type SquareMap = Record<Square, undefined>;

export type LearnActivityState = {
  activityType: 'learn';
  activityState: {
    fen: ChessFEN;
    boardOrientation: ChessColor;
    arrows: ArrowsMap;
    circles: CirclesMap;
    history: {
      // moves: ChessRecursiveHistoryWithFen;
      startingFen: ChessFEN;
      moves: ChessHistory_NEW;
      focusedIndex: ChessHistoryIndex_NEW;
    };
  };
};

export type OtherActivities = {
  activityType: 'play' | 'meetup' | 'none';
  activityState: {};
};

export type ActivityState = LearnActivityState | OtherActivities;

export const initialActivtityState: ActivityState = {
  activityType: 'none',
  activityState: {},
};

export const initialLearnActivityState: LearnActivityState = {
  activityType: 'learn',
  activityState: {
    boardOrientation: 'white',
    fen: ChessFENBoard.STARTING_FEN,
    arrows: {},
    circles: {},
    history: {
      startingFen: ChessFENBoard.STARTING_FEN,
      moves: [],
      focusedIndex: [-1, 1],
    },
  },
};

// PART 2: Action Types

export type ActivityActions =
  | Action<'dropPiece', ChessMove>
  | Action<'importPgn', ChessPGN>
  | Action<'importFen', ChessFEN>
  | Action<
      'focusHistoryIndex',
      {
        index: ChessHistoryIndex_NEW;
      }
    >
  | Action<'deleteHistoryMove', { atIndex: ChessHistoryIndex_NEW }>
  | Action<'changeBoardOrientation', ChessColor>
  | Action<'arrowChange', ArrowsMap>
  | Action<'drawCircle', CircleDrawTuple>
  | Action<'clearCircles'>;

// PART 3: The Reducer – This is where all the logic happens

export default (
  prev: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType === 'learn') {
    // TODO: Should this be split?

    if (action.type === 'dropPiece') {
      try {
        const { from, to, promoteTo } = action.payload;

        const instance = new ChessFENBoard(prev.activityState.fen);
        const fenPiece = instance.piece(from);

        if (!fenPiece) {
          console.error('Err', instance.board);
          throw new Error(`No Piece at ${from}`);
        }

        const promoteToFenBoardPiecesymbol:
          | FenBoardPromotionalPieceSymbol
          | undefined = promoteTo
          ? (pieceSanToFenBoardPieceSymbol(
              promoteTo
            ) as FenBoardPromotionalPieceSymbol)
          : undefined;

        const nextMove = instance.move(
          from,
          to,
          promoteToFenBoardPiecesymbol
        ) as ChessHistoryMove_NEW;

        // const addAtIndex = atIndex !== undefined ? atIndex : prev.history.length;
        // const [nextHistory, addedAtIndex] =
        //   addMoveToChessHistoryAtNextAvailableIndex(
        //     prev.activityState.history.moves,
        //     prev.activityState.history.moves.length,
        //     nextMove
        //   );
        // console.log('drop piece', action.payload, 'prev', prev);

        // const addAtIndex = prev.activityState.history.focusedIndex;

        // console.log('this worked', addAtIndex)

        // Add Use case to handle Invalid Moves on Learn Activity

        const prevMove = findMoveAtIndexRecursively(
          prev.activityState.history.moves,
          prev.activityState.history.focusedIndex
        );

        const { moves: prevHistoryMoves, focusedIndex: prevFocusedIndex } =
          prev.activityState.history;

        // If the moves are the same introduce a non move
        const [nextHistory, addedAtIndex] = invoke(() => {
          const isFocusedIndexLastInBranch = isLastHistoryIndexInBranch(
            prevHistoryMoves,
            prevFocusedIndex
          );

          // console.log('isFocusedIndexLastInBranch', isFocusedIndexLastInBranch);
          // console.log('prevFocusedIndex', prevFocusedIndex);

          // const isFocusIndexNested = !!prevFocusedIndex[2];
          const [
            prevFocusTurnIndex,
            prevFocusMovePosition,
            prevFocusRecursiveIndexes,
          ] = prevFocusedIndex;

          if (prevFocusRecursiveIndexes) {
            console.log('prevFocusRecursiveIndexes', prevFocusRecursiveIndexes);

            const addAt = incrementNestedHistoryIndex(prevFocusedIndex);

            console.log('add at', addAt);
            console.log('prevMove', prevMove);

            if (prevMove?.color === nextMove.color) {
              const [nextHistory, addedAtIndex] = addMoveToChessHistory(
                prev.activityState.history.moves,
                getHistoryNonMove(swapColor(nextMove.color)),
                addAt
              );

              return addMoveToChessHistory(
                nextHistory,
                nextMove,
                incrementNestedHistoryIndex(addedAtIndex)
                // addAtIndex
                // prev.activityState.history.focusedIndex
              );
            }

            return addMoveToChessHistory(
              prev.activityState.history.moves,
              nextMove,
              addAt
              // addAtIndex
              // prev.activityState.history.focusedIndex
            );
          }

          // console.log('isFocusedIndexLastInBranch', isFocusedIndexLastInBranch);

          const addAtIndex = isFocusedIndexLastInBranch
            ? incrementNestedHistoryIndex(
                prev.activityState.history.focusedIndex
              )
            : prev.activityState.history.focusedIndex;

          // prev.activityState.history.focusedIndex;

          // if 1st move is black add a non move
          if (prevHistoryMoves.length === 0 && nextMove.color === 'b') {
            const [nextHistory, addedAtIndex] = addMoveToChessHistory(
              prev.activityState.history.moves,
              getHistoryNonMove(swapColor(nextMove.color))
            );

            return addMoveToChessHistory(nextHistory, nextMove);
          }

          // If it's not the last branch
          if (!isFocusedIndexLastInBranch) {
            return addMoveToChessHistory(
              prev.activityState.history.moves,
              nextMove,
              prevFocusedIndex
              // addAtIndex
              // prev.activityState.history.focusedIndex
            );
          }

          // Add nonMoves for skipping one
          if (prevMove?.color === nextMove.color) {
            const [nextHistory, addedAtIndex] = addMoveToChessHistory(
              prev.activityState.history.moves,
              getHistoryNonMove(swapColor(nextMove.color)),
              addAtIndex
            );

            return addMoveToChessHistory(nextHistory, nextMove);
          }

          return addMoveToChessHistory(
            prev.activityState.history.moves,
            nextMove
            // addAtIndex
            // prev.activityState.history.focusedIndex
          );
        });

        // console.log('prevMove', prevMove);

        // const [nextHistory, addedAtIndex] = addMoveToChessHistory(
        //   prev.activityState.history.moves,
        //   nextMove,
        //   addAtIndex
        //   // prev.activityState.history.focusedIndex
        // );

        console.log('next history', nextHistory, nextHistory.length);
        console.log('addedAtIndex', addedAtIndex);

        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            fen: instance.fen,
            circles: {},
            arrows: {},
            history: {
              ...prev.activityState.history,
              moves: nextHistory,
              focusedIndex: addedAtIndex,
            },
            // moveHistory: ,
            // focusedIndex:
          },
        };
      } catch (e) {
        console.error('failed', e);

        return prev;
      }
    }
    // TODO: Bring all of these back
    else if (action.type === 'importFen') {
      if (!ChessFENBoard.validateFenString(action.payload).ok) {
        return prev;
      }

      const nextMoves: ChessRecursiveHistory_NEW = [];

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          fen: action.payload,
          circles: {},
          arrows: {},
          history: {
            startingFen: ChessFENBoard.STARTING_FEN,
            moves: nextMoves,
            focusedIndex: getHistoryLastIndex(nextMoves),
          },
        },
      };
    } else if (action.type === 'importPgn') {
      if (!isValidPgn(action.payload)) {
        return prev;
      }

      const instance = getNewChessGame({
        pgn: action.payload,
      });

      const nextHistoryMovex = pgnToHistory(action.payload);

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          fen: instance.fen(),
          circles: {},
          arrows: {},
          history: {
            startingFen: ChessFENBoard.STARTING_FEN,
            moves: nextHistoryMovex,
            // focusedIndex: nextHistoryMovex.length - 1,
            focusedIndex: getHistoryLastIndex(nextHistoryMovex),
          },
        },
      };
    } else if (action.type === 'focusHistoryIndex') {
      // console.log('get history at index', action.payload.index);

      const historyAtFocusedIndex = getHistoryAtIndex(
        prev.activityState.history.moves,
        action.payload.index
        // TODO: Add recursive
      );

      // TOOO// Need to create a history with the branched histories

      // console.log('historyAtFocusedIndex', historyAtFocusedIndex ? renderHistoryIndex(historyAtFocusedIndex) : '');

      const instance = new ChessFENBoard(
        prev.activityState.history.startingFen
      );

      historyAtFocusedIndex.forEach((turn, i) => {
        // if (m.isNonMove) {
        //   return;
        // }

        try {
          turn.forEach((m) => {
            if (m.isNonMove) {
              return;
            }
            instance.move(m.from, m.to);
          });
        } catch (e) {
          // console.log('failed at m', m, 'i', i);
          throw e;
        }
      });

      const nextFen = instance.fen;

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          fen: nextFen,
          history: {
            ...prev.activityState.history,
            focusedIndex: action.payload.index,
          },
        },
      };

      // const fenPiece = instance.piece(from);
    }

    if (action.type === 'deleteHistoryMove') {
      const nextIndex = decrementHistoryIndex(action.payload.atIndex);
      const nextHistory = getHistoryAtIndex(
        prev.activityState.history.moves,
        nextIndex
      );

      const instance = new ChessFENBoard(
        prev.activityState.history.startingFen
      );

      nextHistory.forEach((turn, i) => {
        turn.forEach((m) => {
          if (m.isNonMove) {
            return;
          }
          instance.move(m.from, m.to);
        });
      });

      const nextFen = instance.fen;

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          circles: {},
          arrows: {},
          fen: nextFen,
          history: {
            ...prev.activityState.history,
            focusedIndex: nextIndex,
            moves: nextHistory,
          },
        },
      };
    }

    if (action.type === 'changeBoardOrientation') {
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          boardOrientation: action.payload,
        },
      };
    }

    if (action.type === 'arrowChange') {
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          arrows: action.payload,
        },
      };
    }

    if (action.type === 'drawCircle') {
      const [at, hex] = action.payload;

      const circleId = `${at}`;

      const { [circleId]: existent, ...restOfCirles } =
        prev.activityState.circles;

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          circles: {
            ...restOfCirles,
            ...(!!existent
              ? undefined // Set it to undefined if same
              : { [circleId]: action.payload }),
          },
        },
      };
    }

    if (action.type === 'clearCircles') {
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          circles: {},
        },
      };
    }
  }

  return prev;
};
