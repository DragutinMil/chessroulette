import {
  ChessFENBoard,
  FreeBoardHistory,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  isValidPgn,
  FBHHistory,
} from '@xmatter/util-kit';
import { Chapter, ChapterState, LearnAiActivityState } from './types';
//import { FBHIndexMovePosition,FBHRecursiveIndexes } from 'util-kit/src/lib/FreeBoardHistory/types';

import { initialChapterState, initialDefaultChapter } from './state';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { MovexReducer } from 'movex-core-util';

import { ChessRouler } from 'util-kit/src/lib/ChessRouler';
import { logsy } from '@app/lib/Logsy';

export const findLoadedChapter = (
  activityState: LearnAiActivityState['activityState']
): Chapter | undefined =>
  activityState.chaptersMap[activityState.loadedChapterId];

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'ailearn') {
    return prev;
  }
  console.log('ailearn', action);
  if (action.type === 'loadedChapter:takeBack') {
    const prevChapter = findLoadedChapter(prev.activityState);
    if (!prevChapter) {
      console.error('The chapter wasnt found');
      return prev;
    }
    let newHistory = prevChapter.notation.history.map((inner) => [...inner]);
    const [row, col] = prevChapter.notation.focusedIndex;

    const safeRow = Math.max(0, Math.min(row, newHistory.length - 1));
    const safeCol = Math.max(0, Math.min(col, newHistory[safeRow]?.length - 1));

    if (safeRow === 0 && safeCol === 0) {
      newHistory.pop();
    } else if (safeCol === 0) {
      newHistory.pop();
      newHistory.at(-1)?.pop();
    } else if (safeCol === 1) {
      newHistory.pop();
    }
    const historyAtFocusedIndex =
      FreeBoardHistory.calculateLinearHistoryToIndex(
        prevChapter.notation.history,
        action.payload
      );

    // TODO: Here this can be abstracted
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    historyAtFocusedIndex.forEach((m) => {
      if (!m.isNonMove) {
        fenBoard.move(m);
      }
    });

    const nextChapterState: ChapterState = {
      ...prevChapter,
      displayFen: fenBoard.fen,
      notation: {
        ...prevChapter.notation,
        history: newHistory as FBHHistory,
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

  //potezi automatski

  if (action.type === 'loadedChapter:addMove') {
    // TODO: the logic for this should be in GameHistory class/static  so it can be tested
    try {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The loaded chapter was not found');
        return prev;
      }

      const move = action.payload;

      const fenBoard = new ChessFENBoard(prevChapter.displayFen);
      const fenPiece = fenBoard.piece(move.from);
      if (!fenPiece) {
        console.error('Action Err', action, prev, fenBoard.board);
        throw new Error(`No Piece at ${move.from}`);
      }

      const nextMove = fenBoard.move(move);

      // If the moves are the same introduce a non move
      const [nextHistory, addedAtIndex] = FreeBoardHistory.addMagicMove(
        {
          history: prevChapter.notation.history,
          atIndex: prevChapter.notation.focusedIndex,
        },
        nextMove
      );

      const nextChapter: Chapter = {
        ...prevChapter,
        displayFen: fenBoard.fen,
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
      console.error('Action Error', action, prev, e);
      return prev;
    }
  }

  if (action.type === 'loadedChapter:import') {
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('The chapter wasnt found');
      return prev;
    }

    if (action.payload.input.type === 'FEN') {
      if (!ChessFENBoard.validateFenString(action.payload.input.val).ok) {
        return prev;
      }

      const nextFen = action.payload.input.val;
      const notation = {
        startingFen: nextFen,
        history: [],
        focusedIndex: FreeBoardHistory.getStartingIndex(),
      };
      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: nextFen,
        // When importing PGNs set the notation from this fen
        notation: notation,
      };

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [0]: {
              ...prev.activityState.chaptersMap[0],
              ...nextChapterState,
            },
          },
        },
      };
    }

    if (action.payload.input.type === 'PGN') {
      if (!isValidPgn(action.payload.input.val)) {
        return prev;
      }
      const chessGame = getNewChessGame({
        pgn: action.payload.input.val,
      });
      const nextHistory = FreeBoardHistory.pgnToHistory(
        action.payload.input.val
      );

      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: chessGame.fen(),

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
            [0]: {
              ...prev.activityState.chaptersMap[0],
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

    // TODO: Here this can be abstracted
    // console.log(
    //   'prevChapter.notation.startingFen',
    //   prevChapter.notation.startingFen
    // );
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    historyAtFocusedIndex.forEach((m) => {
      if (!m.isNonMove) {
        let isPromotionWhite;
        let isPromotionBlack;
        const moveData = m as any; // ovde rešavaš TS problem
        if (moveData.promotion) {
          isPromotionWhite =
            moveData.piece === 'p' &&
            moveData.color === 'w' &&
            moveData.to[1] === '8';
          isPromotionBlack =
            moveData.piece === 'p' &&
            moveData.color === 'b' &&
            moveData.to[1] === '1';
        }

        const move = {
          from: moveData.from,
          to: moveData.to,
          ...(isPromotionWhite && {
            promoteTo: moveData.promotion.toUpperCase() ?? 'Q',
          }),
          ...(isPromotionBlack && { promoteTo: moveData.promotion ?? 'q' }),
        };

        fenBoard.move(move);
      }
    });

    const nextChapterState: ChapterState = {
      ...prevChapter,
      displayFen: fenBoard.fen,
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

    const [at, hex, piece] = action.payload;
    const circleId = `${at}`;
    const { [circleId]: existent, ...restOfCirlesMap } = prevChapter.circlesMap;

    const nextChapter: Chapter = {
      ...prevChapter,
      circlesMap: {
        ...restOfCirlesMap,
        ...(!!existent
          ? undefined // Set it to undefined if same
          : { [circleId]: [at, hex] }),
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

    const nextFen = action.payload;

    const nextChapter: Chapter = {
      ...prevChapter,
      displayFen: nextFen,
      arrowsMap: {},
      circlesMap: {},

      // Ensure the notation resets each time there is an update (the starting fen might change)
      notation: {
        ...initialChapterState.notation,
        // this needs to always start from the given fen, otherwise issues may arise
        startingFen: nextFen,
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

  if (action.type === 'updateChapter') {
    const { [action.payload.id]: prevChapter } = prev.activityState.chaptersMap;

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

  if (action.type === 'loadedChapter:setLearnAi') {
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [0]: {
            ...prev.activityState.chaptersMap[0],
            aiLearn: action.payload,
          },
        },
      },
    };
  }

  if (action.type === 'loadedChapter:writeMessage') {
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [0]: {
            ...prev.activityState.chaptersMap[0],
            messages: [
              ...(prev.activityState.chaptersMap[0].messages ?? []),
              {
                content: action.payload.content,
                participantId: action.payload.participantId,

                idResponse: action.payload.idResponse,
              },
            ],
          },
        },
      },
    };
  }

  return prev;
};
