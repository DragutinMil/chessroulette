import {
  ChessArrowId,
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  ChessPGN,
  ChesscircleId,
  FBHHistory,
  FBHIndex,
  FBHMove,
  FenBoardPromotionalPieceSymbol,
  FreeBoardHistory,
  getNewChessGame,
  invoke,
  isValidPgn,
  pieceSanToFenBoardPieceSymbol,
  swapColor,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import { Action, objectKeys } from 'movex-core-util';

export type ArrowDrawTuple = [from: Square, to: Square, hex?: string];
export type ArrowsMap = Record<ChessArrowId, ArrowDrawTuple>;

export type CircleDrawTuple = [at: Square, hex: string];
export type CirclesMap = Record<ChesscircleId, CircleDrawTuple>;

export type SquareMap = Record<Square, undefined>;

export type LearnActivityState = {
  activityType: 'learn';
  activityState: {
    // fen: ChessFEN;
    // boardOrientation: ChessColor;
    // arrows: ArrowsMap;
    // circles: CirclesMap;
    // history: {
    //   startingFen: ChessFEN;
    //   moves: FBHHistory;
    //   focusedIndex: FBHIndex;
    // };
    currentChapterId: Chapter['id'] | undefined;
    chaptersMap: Record<Chapter['id'], Chapter>;
    chaptersIndex: number;

    // This is only here when there is no chapter created - kinda like
    // student and instructor just play around
    freeChapter: ChapterState;
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

export type Chapter = {
  id: string;
  createdAt: number;
} & ChapterState;

export type ChapterState = {
  name: string;

  // Also the chapter might get a type: position, or puzzle (containing next correct moves)

  notation: {
    // The starting fen is the chapter fen
    history: FBHHistory;
    focusedIndex: FBHIndex;
    startingFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily
  };
} & ChapterBoardState;

export type ChapterBoardState = {
  // Board State
  displayFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily

  // fen: ChessFEN;
  arrowsMap: ArrowsMap;
  circlesMap: CirclesMap;

  // TODO: This make required once refactored
  orientation: ChessColor;
};

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.STARTING_FEN,
  },
  orientation: 'w',
};

export const initialFreeChapter = { ...initialChapterState, name: '' };

export const initialLearnActivityState: LearnActivityState = {
  activityType: 'learn',
  activityState: {
    currentChapterId: undefined,
    chaptersMap: {},
    chaptersIndex: 0,
    freeChapter: initialFreeChapter,
  },
};

// PART 2: Action Types

export type ActivityActions =
  // Chapter Logistcs
  | Action<'createChapter', ChapterState>
  | Action<
      'updateChapter',
      {
        id: Chapter['id'];
        state: Partial<ChapterState>;
      }
    >
  | Action<'deleteChapter', { id: Chapter['id'] }>
  | Action<'loadChapter', { id: Chapter['id'] }>

  // Board
  | Action<
      'dropPiece',
      {
        move: ChessMove;
        // If not present, it's free chapter
        chapterId?: Chapter['id'];
      }
    >
  | Action<'importPgn', ChessPGN>
  | Action<'importFen', ChessFEN>
  | Action<'focusHistoryIndex', { index: FBHIndex; chapterId?: Chapter['id'] }>
  | Action<'deleteHistoryMove', { atIndex: FBHIndex }>
  | Action<'changeBoardOrientation', ChessColor>
  | Action<'arrowChange', ArrowsMap>
  | Action<'drawCircle', CircleDrawTuple>
  | Action<'clearCircles'>;

// TODO: All of these are chapter based so most likely they will need to incorporate the chapter id
// | Action<'dropPiece', { chapterId?: Chapter['id']; move: ChessMove }>

// TODO: These can be compacted into one "import"
// | Action<'import', { chapterId?: Chapter['id']; input: {
//   type: 'PGN';
// } }>
// | Action<'importPgn', { chapterId?: Chapter['id']; input: ChessPGN }>
// | Action<'importFen', { chapterId?: Chapter['id']; input: ChessFEN }>
// | Action<'focusHistoryIndex', { chapterId?: Chapter['id']; index: FBHIndex }>
// | Action<
//     'deleteHistoryMove',
//     { chapterId?: Chapter['id']; atIndex: FBHIndex }
//   >
// | Action<
//     'changeBoardOrientation',
//     { chapterId?: Chapter['id']; color: ChessColor }
//   >
// | Action<'arrowChange', { chapterId?: Chapter['id']; arrowsMap: ArrowsMap }>
// | Action<'drawCircle', { chapterId?: Chapter['id']; circle: CircleDrawTuple }>
// | Action<'clearCircles', { chapterId?: Chapter['id'] }>;

// PART 3: The Reducer – This is where all the logic happens

const getPrevChapterAndDetails = (
  activityState: LearnActivityState['activityState'],
  chapterId?: string
) => {
  if (!chapterId) {
    // if the chapter id isn't present, return freeChapter - but mybe it should throw an error

    return {
      chapterType: 'freeChapter',
      chapter: activityState.freeChapter,
      chapterId: undefined,
    } as const;
  }

  return {
    chapterType: 'identifiable',
    chapterId,
    chapter: activityState.chaptersMap[chapterId] as ChapterState | undefined,
  } as const;
};

export default (
  prev: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  console.group('Action', action.type);
  console.log('payload', (action as any).payload);
  console.log('prev', prev);
  console.log('');
  console.groupEnd();

  if (prev.activityType === 'learn') {
    // TODO: Should this be split?
    if (action.type === 'dropPiece') {
      // TODO: the logic for this should be in GameHistory class/static  so it can be tested
      try {
        const { from, to, promoteTo } = action.payload.move;
        // const prevChapter = action.payload.chapterId
        //   ? prev.activityState.chaptersMap[action.payload.chapterId] ||
        //     undefined
        //   : prev.activityState.freeChapter;

        const prevChapterAndDetails = getPrevChapterAndDetails(
          prev.activityState,
          action.payload.chapterId
        );

        if (!prevChapterAndDetails.chapter) {
          console.error('The chapter wasnt found');
          return prev;
        }

        const prevChapter = prevChapterAndDetails.chapter;

        const instance = new ChessFENBoard(prevChapter.displayFen);
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
        ) as FBHMove;
        const prevMove = FreeBoardHistory.findMoveAtIndex(
          prevChapter.notation.history,
          prevChapter.notation.focusedIndex
        );
        const { history: prevHistoryMoves, focusedIndex: prevFocusedIndex } =
          prevChapter.notation;
        // If the moves are the same introduce a non move
        const [nextHistory, addedAtIndex] = invoke(() => {
          const isFocusedIndexLastInBranch =
            FreeBoardHistory.isLastIndexInHistoryBranch(
              prevHistoryMoves,
              prevFocusedIndex
            );
          const [_, __, prevFocusRecursiveIndexes] = prevFocusedIndex;
          if (prevFocusRecursiveIndexes) {
            const addAtIndex =
              FreeBoardHistory.incrementIndex(prevFocusedIndex);
            if (prevMove?.color === nextMove.color) {
              const [nextHistory, addedAtIndex] = FreeBoardHistory.addMove(
                prevChapter.notation.history,
                FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
                addAtIndex
              );
              return FreeBoardHistory.addMove(
                nextHistory,
                nextMove,
                FreeBoardHistory.incrementIndex(addedAtIndex)
              );
            }
            return FreeBoardHistory.addMove(
              prevChapter.notation.history,
              nextMove,
              addAtIndex
            );
          }
          const addAtIndex = isFocusedIndexLastInBranch
            ? FreeBoardHistory.incrementIndex(prevChapter.notation.focusedIndex)
            : prevChapter.notation.focusedIndex;
          // if 1st move is black add a non move
          if (prevHistoryMoves.length === 0 && nextMove.color === 'b') {
            const [nextHistory] = FreeBoardHistory.addMove(
              prevChapter.notation.history,
              FreeBoardHistory.getNonMove(swapColor(nextMove.color))
            );
            return FreeBoardHistory.addMove(nextHistory, nextMove);
          }
          // If it's not the last branch
          if (!isFocusedIndexLastInBranch) {
            return FreeBoardHistory.addMove(
              prevChapter.notation.history,
              nextMove,
              prevFocusedIndex
            );
          }
          // Add nonMoves for skipping one
          if (prevMove?.color === nextMove.color) {
            const [nextHistory] = FreeBoardHistory.addMove(
              prevChapter.notation.history,
              FreeBoardHistory.getNonMove(swapColor(nextMove.color)),
              addAtIndex
            );
            return FreeBoardHistory.addMove(nextHistory, nextMove);
          }
          return FreeBoardHistory.addMove(
            prevChapter.notation.history,
            nextMove
          );
        });

        // const nextChapter = action.payload.chapterId ? {
        //   ...prevChapter
        // }
        const nextChapterState: ChapterState = {
          ...prevChapter,
          displayFen: instance.fen,
          circlesMap: {},
          arrowsMap: {},
          notation: {
            ...prevChapter.notation,
            history: nextHistory,
            focusedIndex: addedAtIndex,
          },
        };

        if (prevChapterAndDetails.chapterType === 'identifiable') {
          return {
            ...prev,
            activityState: {
              ...prev.activityState,
              chaptersMap: {
                ...prev.activityState.chaptersMap,
                [prevChapterAndDetails.chapterId]: {
                  ...prev.activityState.chaptersMap[
                    prevChapterAndDetails.chapterId
                  ],
                  ...nextChapterState,
                },
              },
            },
          };
        }

        // Otherwise it's a Free chapter
        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            freeChapter: nextChapterState,
          },
        };
      } catch (e) {
        console.error('failed', e);
        return prev;
      }
    }
    // // TODO: Bring all of these back
    // else if (action.type === 'importFen') {
    //   if (!ChessFENBoard.validateFenString(action.payload).ok) {
    //     return prev;
    //   }
    //   const nextMoves: FBHHistory = [];
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: action.payload,
    //       circles: {},
    //       arrows: {},
    //       history: {
    //         startingFen: ChessFENBoard.STARTING_FEN,
    //         moves: nextMoves,
    //         focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextMoves),
    //       },
    //     },
    //   };
    // } else if (action.type === 'importPgn') {
    //   if (!isValidPgn(action.payload)) {
    //     return prev;
    //   }
    //   const instance = getNewChessGame({
    //     pgn: action.payload,
    //   });
    //   const nextHistoryMovex = FreeBoardHistory.pgnToHistory(action.payload);
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       fen: instance.fen(),
    //       circles: {},
    //       arrows: {},
    //       history: {
    //         startingFen: ChessFENBoard.STARTING_FEN,
    //         moves: nextHistoryMovex,
    //         focusedIndex:
    //           FreeBoardHistory.getLastIndexInHistory(nextHistoryMovex),
    //       },
    //     },
    //   };
    // }
    else if (action.type === 'focusHistoryIndex') {
      // TODO: absract this away
      // const prevChapter = action.payload.chapterId
      //   ? prev.activityState.chaptersMap[action.payload.chapterId] || undefined
      //   : prev.activityState.freeChapter;
      const prevChapterAndDetails = getPrevChapterAndDetails(
        prev.activityState,
        action.payload.chapterId
      );

      if (!prevChapterAndDetails.chapter) {
        console.error('The chapter wasnt found');
        return prev;
      }

      const prevChapter = prevChapterAndDetails.chapter;

      const historyAtFocusedIndex =
        FreeBoardHistory.calculateLinearHistoryToIndex(
          prevChapter.notation.history,
          action.payload.index
        );
      const instance = new ChessFENBoard(prevChapter.notation.startingFen);
      historyAtFocusedIndex.forEach((m) => {
        if (!m.isNonMove) {
          instance.move(m.from, m.to);
        }
      });

      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: instance.fen,
        notation: {
          ...prevChapter.notation,
          focusedIndex: action.payload.index,
        },
      };

      if (prevChapterAndDetails.chapterType === 'identifiable') {
        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            chaptersMap: {
              ...prev.activityState.chaptersMap,
              [prevChapterAndDetails.chapterId]: {
                ...prev.activityState.chaptersMap[
                  prevChapterAndDetails.chapterId
                ],
                ...nextChapterState,
              },
            },
          },
        };
      }

      // Otherwise it's a Free chapter
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          freeChapter: nextChapterState,
        },
      };
    }
    // if (action.type === 'deleteHistoryMove') {
    //   // TODO: Fix this!
    //   // const nextIndex = FreeBoardHistory.decrementIndexAbsolutely(action.payload.atIndex);
    //   const [slicedHistory, lastIndexInSlicedHistory] =
    //     FreeBoardHistory.sliceHistory(
    //       prev.activityState.history.moves,
    //       action.payload.atIndex
    //     );
    //   const nextHistory =
    //     FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    //   const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
    //     nextHistory,
    //     FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
    //     'left'
    //   );
    //   const instance = new ChessFENBoard(
    //     prev.activityState.history.startingFen
    //   );
    //   nextHistory.forEach((turn, i) => {
    //     turn.forEach((m) => {
    //       if (m.isNonMove) {
    //         return;
    //       }
    //       instance.move(m.from, m.to);
    //     });
    //   });
    //   const nextFen = instance.fen;
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {},
    //       arrows: {},
    //       fen: nextFen,
    //       history: {
    //         ...prev.activityState.history,
    //         focusedIndex: nextIndex,
    //         moves: nextHistory,
    //       },
    //     },
    //   };
    // }
    // if (action.type === 'changeBoardOrientation') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       boardOrientation: action.payload,
    //     },
    //   };
    // }
    // if (action.type === 'arrowChange') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       arrows: action.payload,
    //     },
    //   };
    // }
    // if (action.type === 'drawCircle') {
    //   const [at, hex] = action.payload;
    //   const circleId = `${at}`;
    //   const { [circleId]: existent, ...restOfCirles } =
    //     prev.activityState.circles;
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {
    //         ...restOfCirles,
    //         ...(!!existent
    //           ? undefined // Set it to undefined if same
    //           : { [circleId]: action.payload }),
    //       },
    //     },
    //   };
    // }
    // if (action.type === 'clearCircles') {
    //   return {
    //     ...prev,
    //     activityState: {
    //       ...prev.activityState,
    //       circles: {},
    //     },
    //   };
    // }
    if (action.type === 'createChapter') {
      const nextChapterIndex = prev.activityState.chaptersIndex + 1;
      const nextChapterId = String(nextChapterIndex);

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapterId]: {
              id: nextChapterId,
              createdAt: new Date().getTime(),
              ...action.payload,
            },
          },
          currentChapterId: nextChapterId,
          chaptersIndex: nextChapterIndex,
        },
      };
    }
    if (action.type === 'updateChapter') {
      const { [action.payload.id]: prevChapter } =
        prev.activityState.chaptersMap;
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [action.payload.id]: {
              ...prevChapter,
              ...action.payload.state,
            },
          },
        },
      };
    }
    if (action.type === 'deleteChapter') {
      const { [action.payload.id]: removed, ...nextChapters } =
        prev.activityState.chaptersMap;
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: nextChapters,
        },
      };
    }
    if (action.type === 'loadChapter') {
      const { [action.payload.id]: chapter } = prev.activityState.chaptersMap;
      if (!chapter) {
        return prev;
      }

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          currentChapterId: chapter.id,
          // fen: chapter.fen,
          // arrows: chapter.arrowsMap || {},
          // circles: chapter.circlesMap || {},
          // boardOrientation: chapter.orientation,
        },
      };
    }
  }

  return prev;
};
