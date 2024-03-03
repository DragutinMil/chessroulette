import {
  ChessFENBoard,
  FBHMove,
  FenBoardPromotionalPieceSymbol,
  FreeBoardHistory,
  getNewChessGame,
  invoke,
  isValidPgn,
  pieceSanToFenBoardPieceSymbol,
  swapColor,
} from '@xmatter/util-kit';
import {
  LearnActivityActions,
  ActivityState,
  Chapter,
  ChapterState,
  LearnActivityState,
  initialActivtityState,
} from './types';
import { initialChapterState, initialDefaultChapter } from './state';

export const findLoadedChapter = (
  activityState: LearnActivityState['activityState']
): Chapter | undefined =>
  activityState.chaptersMap[activityState.loadedChapterId];

export const reducer = (
  prev: ActivityState = initialActivtityState,
  action: LearnActivityActions
): ActivityState => {
  if (prev.activityType === 'learn') {
    // TODO: Should this be split?
    if (action.type === 'loadedChapter:addMove') {
      // TODO: the logic for this should be in GameHistory class/static  so it can be tested
      try {
        const prevChapter = findLoadedChapter(prev.activityState);

        if (!prevChapter) {
          console.error('The loaded chapter was not found');
          return prev;
        }

        const { from, to, promoteTo } = action.payload;

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

        const nextChapter: Chapter = {
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

        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            chaptersMap: {
              ...prev.activityState.chaptersMap,
              [prevChapter.id]: nextChapter,
            },
          },
        };
      } catch (e) {
        console.error('failed', e);
        return prev;
      }
    }
    if (action.type === 'loadedChapter:import') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The chapter wasnt found');
        return prev;
      }

      if (action.payload.type === 'FEN') {
        if (!ChessFENBoard.validateFenString(action.payload.input).ok) {
          console.log('not valid fen');
          return prev;
        }

        const nextFen = action.payload.input;
        const nextChapterState: ChapterState = {
          ...prevChapter,
          displayFen: nextFen,

          // When importing PGNs set the notation from this fen
          notation: {
            startingFen: nextFen,
            history: [],
            focusedIndex: FreeBoardHistory.getStartingIndex(),
          },
        };

        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            chaptersMap: {
              ...prev.activityState.chaptersMap,
              [prevChapter.id]: {
                ...prev.activityState.chaptersMap[prevChapter.id],
                ...nextChapterState,
              },
            },
          },
        };
      }

      if (action.payload.type === 'PGN') {
        if (!isValidPgn(action.payload.input)) {
          console.log('not valid pgn');
          return prev;
        }

        const instance = getNewChessGame({
          pgn: action.payload.input,
        });
        const nextHistory = FreeBoardHistory.pgnToHistory(action.payload.input);

        const nextChapterState: ChapterState = {
          ...prevChapter,
          displayFen: instance.fen(),

          // When importing PGNs set the notation history as well
          notation: {
            startingFen: ChessFENBoard.STARTING_FEN,
            history: nextHistory,
            focusedIndex: FreeBoardHistory.getLastIndexInHistory(nextHistory),
          },
        };

        return {
          ...prev,
          activityState: {
            ...prev.activityState,
            chaptersMap: {
              ...prev.activityState.chaptersMap,
              [prevChapter.id]: {
                ...prev.activityState.chaptersMap[prevChapter.id],
                ...nextChapterState,
              },
            },
          },
        };
      }
    }

    if (action.type === 'loadedChapter:focusHistoryIndex') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The chapter wasnt found');
        return prev;
      }

      const historyAtFocusedIndex =
        FreeBoardHistory.calculateLinearHistoryToIndex(
          prevChapter.notation.history,
          action.payload
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
          focusedIndex: action.payload,
        },
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [prevChapter.id]: {
              ...prev.activityState.chaptersMap[prevChapter.id],
              ...nextChapterState,
            },
          },
        },
      };
    }

    if (action.type === 'loadedChapter:deleteHistoryMove') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const [slicedHistory, lastIndexInSlicedHistory] =
        FreeBoardHistory.sliceHistory(
          prevChapter.notation.history,
          action.payload
        );
      const nextHistory =
        FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
      const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
        nextHistory,
        FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
        'left'
      );
      const instance = new ChessFENBoard(prevChapter.notation.startingFen);
      nextHistory.forEach((turn, i) => {
        turn.forEach((m) => {
          if (m.isNonMove) {
            return;
          }
          instance.move(m.from, m.to);
        });
      });
      const nextFen = instance.fen;

      const nextChapter: Chapter = {
        ...prevChapter,
        displayFen: nextFen,
        circlesMap: {},
        arrowsMap: {},
        notation: {
          ...prevChapter.notation,
          history: nextHistory,
          focusedIndex: nextIndex,
        },
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }
    if (action.type === 'loadedChapter:setOrientation') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const nextChapter: Chapter = {
        ...prevChapter,
        orientation: action.payload,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }
    if (action.type === 'loadedChapter:setArrows') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const nextChapter: Chapter = {
        ...prevChapter,
        arrowsMap: action.payload,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }
    if (action.type === 'loadedChapter:drawCircle') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const [at, hex] = action.payload;
      const circleId = `${at}`;
      const { [circleId]: existent, ...restOfCirlesMap } =
        prevChapter.circlesMap;

      const nextChapter: Chapter = {
        ...prevChapter,
        circlesMap: {
          ...restOfCirlesMap,
          ...(!!existent
            ? undefined // Set it to undefined if same
            : { [circleId]: action.payload }),
        },
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }
    if (action.type === 'loadedChapter:clearCircles') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const nextChapter: Chapter = {
        ...prevChapter,
        circlesMap: {},
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }
    if (action.type === 'loadedChapter:updateFen') {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('No loaded chapter');
        return prev;
      }

      const nextChapter: Chapter = {
        ...prevChapter,
        displayFen: action.payload,
        arrowsMap: {},
        circlesMap: {},

        // Ensure the notation resets each time there is an update (the starting fen might change)
        notation: initialChapterState.notation,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
        },
      };
    }

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
              ...action.payload,
            },
          },
          loadedChapterId: nextChapterId,
          chaptersIndex: nextChapterIndex,
        },
      };
    }
    if (action.type === 'updateChapter') {
      const { [action.payload.id]: prevChapter } =
        prev.activityState.chaptersMap;

      const nextChapter: Chapter = {
        ...prevChapter,
        ...action.payload.state,

        // Ensure the notation resets each time there is an update (the starting fen might change)
        notation: action.payload.state.notation || initialChapterState.notation,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [nextChapter.id]: nextChapter,
          },
          loadedChapterId: nextChapter.id,
        },
      };
    }
    if (action.type === 'deleteChapter') {
      // Remove the current one
      const { [action.payload.id]: removed, ...restChapters } =
        prev.activityState.chaptersMap;

      // and if it's the last one, add the initial one again
      // There always needs to be one chapter in
      const nextChapters =
        Object.keys(restChapters).length > 0
          ? restChapters
          : {
              [initialDefaultChapter.id]: initialDefaultChapter,
            };

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
          loadedChapterId: chapter.id,
        },
      };
    }
  }

  return prev;
};
