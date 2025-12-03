import {
  ChessFENBoard,
  FreeBoardHistory,
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  isValidPgn,
  FBHHistory,
} from '@xmatter/util-kit';
import { Chapter, ChapterState, AichessActivityState } from './types';

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
  activityState: AichessActivityState['activityState']
): Chapter | undefined =>
  activityState.chaptersMap[activityState.loadedChapterId];

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'aichess') {
    return prev;
  }
  console.log('aichess', action);
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

    //console.log('newHistory', newHistory);
    // if (prevChapter.notation.focusedIndex[1] == 0) {
    //   prevChapter.notation.history.pop();
    //   prevChapter.notation.history.at(-1)?.pop();
    // } else if (prevChapter.notation.focusedIndex[1] == 1) {
    //   prevChapter.notation.history.pop();
    // }

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
    const responses = [
      'Let’s go back to the previous position.',
      'Let’s return to the earlier situation.',
      'Let’s reset to the previous state.',
    ];
    const prompt = responses[Math.floor(Math.random() * responses.length)];
    const idResponseTakeBack =
      prev.activityState.chaptersMap[0].messages[
        prev.activityState.chaptersMap[0].messages.length - 1
      ].idResponse;

    const message = {
      content: prompt,
      participantId: 'chatGPT123456',
      idResponse: idResponseTakeBack,
    };
    const lastMessage =
      prevChapter.messages[prevChapter.messages.length - 1]?.content;
    if (typeof lastMessage === 'string' && lastMessage.includes('Let’s ')) {
      const nextChapterState: ChapterState = {
        ...prevChapter,
        displayFen: fenBoard.fen,
        chessAiMode: {
          ...prev.activityState.chaptersMap[0].chessAiMode,
        },
        notation: {
          ...prevChapter.notation,
          focusedIndex: action.payload,
          history: newHistory as FBHHistory,
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
    const nextChapterState: ChapterState = {
      ...prevChapter,
      displayFen: fenBoard.fen,
      chessAiMode: {
        ...prev.activityState.chaptersMap[0].chessAiMode,
      },
      messages: [
        ...(prev.activityState.chaptersMap[0].messages ?? []),
        message,
      ],
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

  // TODO: Should this be split?

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

  if (action.type === 'loadedChapter:addPuzzleMove') {
    if (prev.activityState.chaptersMap[0].chessAiMode.mode == 'puzzle') {
      const move = action.payload.from.concat(action.payload.to);
      if (
        !prev.activityState.chaptersMap[0].chessAiMode.moves[
          prev.activityState.chaptersMap[0].chessAiMode.goodMoves
        ].includes(move)
      ) {
        const badMovePoints = -1;
        // const badMoveCount =
        //   prev.activityState.chaptersMap[0].chessAiMode.badMoves + 1;

        const responses = [
          'That wasn’t the right move.',
          'Would you like a hint, or try again on your own?',
          // "No 🚫, try something else!"
        ];

        const prompt = responses[Math.floor(Math.random() * responses.length)];
        const idResponse =
          prev.activityState.chaptersMap[0].messages[
            prev.activityState.chaptersMap[0].messages.length - 1
          ].idResponse;

        const message = {
          content: prompt,
          participantId: 'chatGPT123456',
          idResponse: idResponse,
        };

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
                  message,
                ],
                chessAiMode: {
                  ...prev.activityState.chaptersMap[0].chessAiMode,
                  ratingChange: badMovePoints,
                  userPuzzleRating:
                    prev.activityState.chaptersMap[0].chessAiMode
                      .userPuzzleRating + badMovePoints,
                  // badMoves: badMoveCount,
                },
              },
            },
          },
        };
      }
    }

    try {
      const prevChapter = findLoadedChapter(prev.activityState);

      if (!prevChapter) {
        console.error('The loaded chapter was not found');
        return prev;
      }

      if (
        prevChapter.notation.history.length > 0 &&
        prevChapter.chessAiMode.mode !== 'review'
      ) {
        if (
          prevChapter.notation.focusedIndex[0] !==
            prevChapter.notation.history?.length - 1 ||
          prevChapter.notation.focusedIndex[1] !==
            prevChapter.notation.history[
              prevChapter.notation.history.length - 1
            ]?.length -
              1
        ) {
          return prev;
        }
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
      const correctionPoints =
        prevChapter.chessAiMode.goodMoves + 1 ==
          prevChapter.chessAiMode.moves.length &&
        prevChapter.chessAiMode.goodMoves % 2 !== 0 &&
        prevChapter.chessAiMode.goodMoves > 0
          ? Math.round(
              (prevChapter.chessAiMode.puzzleRatting -
                prevChapter.chessAiMode.userPuzzleRating) /
                100
            )
          : 0;

      const finnishPoint =
        prevChapter.chessAiMode.goodMoves + 1 ==
          prevChapter.chessAiMode.moves.length &&
        prevChapter.chessAiMode.goodMoves % 2 !== 0 &&
        prevChapter.chessAiMode.goodMoves > 0
          ? 5
          : 0;

      const movePoints =
        prevChapter.orientation !== fenBoard.fen.split(' ')[1] &&
        prevChapter.chessAiMode.mode == 'puzzle'
          ? 2
          : 0;

      const chengeRatingPoints =
        prevChapter.chessAiMode.goodMoves + 1 ==
          prevChapter.chessAiMode.moves.length &&
        prevChapter.chessAiMode.goodMoves % 2 !== 0 &&
        prevChapter.chessAiMode.goodMoves > 0
          ? prevChapter.chessAiMode.ratingChange +
            finnishPoint +
            correctionPoints
          : 0;
      const afterGoodMovePoints = movePoints + chengeRatingPoints;
      const goodMoves = prevChapter.chessAiMode.goodMoves + 1;
      const userPuzzleRating =
        prevChapter.chessAiMode.userPuzzleRating + afterGoodMovePoints;
      prevChapter.chessAiMode.ratingChange;

      if (finnishPoint == 5) {
        const nextChapterEnd: Chapter = {
          ...prevChapter,
          displayFen: fenBoard.fen,
          circlesMap: {},
          arrowsMap: {},
          notation: {
            ...prevChapter.notation,
            history: nextHistory,
            focusedIndex: addedAtIndex,
          },
          chessAiMode: {
            ...prevChapter.chessAiMode,
            userPuzzleRating: userPuzzleRating,
            ratingChange: afterGoodMovePoints,
            mode: 'popup',
            moves: [],
            movesCount: 0,
            badMoves: 0,
            goodMoves: 0,
            orientationChange: false,
            fen: prev.activityState.chaptersMap[0].displayFen,
          },
        };
        return {
          ...prev,
          activityState: {
            ...prev.activityState,

            chaptersMap: {
              ...prev.activityState.chaptersMap,
              [prevChapter.id]: nextChapterEnd,
            },
          },
        };
      } else {
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
          chessAiMode: {
            ...prevChapter.chessAiMode,
            goodMoves: goodMoves,
            userPuzzleRating: userPuzzleRating,
            ratingChange: afterGoodMovePoints,
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
      }
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
    const nextHistory = FreeBoardHistory.removeTrailingNonMoves(slicedHistory);
    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      nextHistory,
      FreeBoardHistory.incrementIndex(lastIndexInSlicedHistory),
      'left'
    );

    // TODO: Here this can be abstracted
    const fenBoard = new ChessFENBoard(prevChapter.notation.startingFen);
    nextHistory.forEach((turn, i) => {
      turn.forEach((m) => {
        if (m.isNonMove) {
          return;
        }
        fenBoard.move(m);
      });
    });
    const nextFen = fenBoard.fen;

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
      orientation: action.payload.color,
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
    const hintCorrection =
      Object.keys(action.payload).length > 0 &&
      prevChapter.chessAiMode.mode == 'puzzle'
        ? 3
        : 0;
    const nextChapter: Chapter = {
      ...prevChapter,
      arrowsMap: action.payload,
      chessAiMode: {
        ...prev.activityState.chaptersMap[0].chessAiMode,
        ratingChange: -hintCorrection,
        userPuzzleRating:
          prev.activityState.chaptersMap[0].chessAiMode.userPuzzleRating -
          hintCorrection,
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
  if (action.type === 'loadedChapter:drawCircle') {
    
    const prevChapter = findLoadedChapter(prev.activityState);

    if (!prevChapter) {
      console.error('No loaded chapter');
      return prev;
    }
    //console.log('ide draw circle', action.payload);
    const hintCorrection =
      Object.keys(action.payload).length > 0 &&
      prevChapter.chessAiMode.mode == 'puzzle'
        ? 2
        : 0;

    const [at, hex, piece] = action.payload;
    const circleId = `${at}`;
    const { [circleId]: existent, ...restOfCirlesMap } = prevChapter.circlesMap;
    const idResponse =
      prev.activityState.chaptersMap[0].messages[
        prev.activityState.chaptersMap[0].messages.length - 1
      ].idResponse;

    // const message = prev.activityState.chaptersMap[0].chessAiMode.mode=='puzzle' ?  {
    //   content: `Think about using your ${piece}`,
    //   participantId: 'chatGPT123456',
    //   idResponse: idResponse,
    // } : {}
    
    
    const nextChapter: Chapter = {
      ...prevChapter,
      circlesMap: {
        ...restOfCirlesMap,
        ...(!!existent
          ? undefined // Set it to undefined if same
          : { [circleId]: [at,hex] }),
      },
      messages: [
        ...(prev.activityState.chaptersMap[0].messages ?? []),
         ...(prev.activityState.chaptersMap[0].chessAiMode.mode === 'puzzle'
    ? [{
        content: `Think about using your ${piece}`,
        participantId: 'chatGPT123456',
        idResponse,
      }]
    : []),
      ],
      chessAiMode: {
        ...prev.activityState.chaptersMap[0].chessAiMode,
        ratingChange: -hintCorrection,
        userPuzzleRating:
          prev.activityState.chaptersMap[0].chessAiMode.userPuzzleRating -
          hintCorrection,
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

  // if (action.type === 'createChapter') {
  //   const nextChapterIndex = prev.activityState.chaptersIndex + 1;
  //   const nextChapterId = String(nextChapterIndex);

  //   return {
  //     ...prev,
  //     activityState: {
  //       ...prev.activityState,
  //       chaptersMap: {
  //         ...prev.activityState.chaptersMap,
  //         [nextChapterId]: {
  //           id: nextChapterId,
  //           ...action.payload,
  //         },
  //       },
  //       loadedChapterId: nextChapterId,
  //       chaptersIndex: nextChapterIndex,
  //     },
  //   };
  // }

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

  if (action.type === 'loadedChapter:setPuzzleMoves') {
    const nextFen = action.payload.fen;
    const chessAiMode = action.payload;

    ///////////PLAY
    if (action.payload.mode === 'play') {
      const responses =
        chessAiMode.message !== ''
          ? [chessAiMode.message]
          : prev.activityState.chaptersMap[0].chessAiMode.mode == ''
          ? [
              "Awesome, let's play chess. Which strength level would you like to play against?",
            ]
          : [
              'Let’s keep it going, nice and casual! Which strength level would you like to play against?',
              'Let’s keep the game rolling, just for fun! Which strength level would you like to play against?',
              'Let’s play on, nice and easy! Which strength level would you like to play against?',
            ];

      const prompt = responses[Math.floor(Math.random() * responses.length)];
      const idResponse =
        chessAiMode.responseId !== ''
          ? chessAiMode.responseId
          : prev.activityState.chaptersMap[0].messages[
              prev.activityState.chaptersMap[0].messages.length - 1
            ].idResponse;

      const message = {
        content: prompt,
        participantId: 'chatGPT123456',
        idResponse: idResponse,
      };

      // const evaluation =
      //   chessAiMode.message !== ''
      //     ? {
      //         prevCp: 0,
      //         newCp: 0,
      //         diffCp: 0,
      //       }
      //     : prev.activityState.chaptersMap[0].evaluation;

      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [0]: {
              ...prev.activityState.chaptersMap[0],
              displayFen: nextFen,
              chessAiMode: chessAiMode,
              notation: {
                startingFen: nextFen,
                history: [],
                focusedIndex: FreeBoardHistory.getStartingIndex(),
              },
              messages: [
                ...(prev.activityState.chaptersMap[0].messages ?? []),
                message,
              ],
              // evaluation: evaluation,
            },
          },
        },
      };
    }

    ///////////// POPUP
    if (action.payload.mode === 'popup') {
      const responses = [
        'Congratulations! You solved it 🎉',
        'You did it! On to the next one 🚀',
        'Great work! You nailed it 🧠',
      ];

      const prompt = responses[Math.floor(Math.random() * responses.length)];
      const idResponse =
        prev.activityState.chaptersMap[0].messages[
          prev.activityState.chaptersMap[0].messages.length - 1
        ].idResponse;
      const message = {
        content: prompt,
        participantId: 'chatGPT123456',
        idResponse: idResponse,
      };
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [0]: {
              ...prev.activityState.chaptersMap[0],
              displayFen: nextFen,
              chessAiMode: chessAiMode,
              notation: {
                startingFen: nextFen,
                history: [],
                focusedIndex: FreeBoardHistory.getStartingIndex(),
              },
              messages: [
                ...(prev.activityState.chaptersMap[0].messages ?? []),
                message,
              ],
            },
          },
        },
      };
    }

    ///////////// REVIEW
    if (action.payload.mode === 'review') {
      if (!isValidPgn(action.payload.fen)) {
        return prev;
      }
      const chessGame = getNewChessGame({
        pgn: action.payload.fen,
      });

      const nextHistory = FreeBoardHistory.pgnToHistory(action.payload.fen);

      const message =
        prev.activityState.chaptersMap[0].messages.length == 0
          ? [
              ...prev.activityState.chaptersMap[0].messages,
              {
                content: 'Hey! 👋 Up for a quick game review?',
                participantId: 'chatGPT123456',
                idResponse: '',
              },
            ]
          : [...prev.activityState.chaptersMap[0].messages];
 
      const orient = action.payload.orientationChange  
      console.log('orient',orient)
      
      if (orient) {
       
        if (prev.activityState.chaptersMap[0].orientation == 'b') {
           console.log('prvi')
          const toOrientation = 'w';
          return {
            ...prev,
            activityState: {
              ...prev.activityState,
              chaptersMap: {
                ...prev.activityState.chaptersMap,
                [0]: {
                  ...prev.activityState.chaptersMap[0],
                  arrowsMap: {},
                  displayFen: chessGame.fen(),
                  chessAiMode: chessAiMode,
                  orientation: toOrientation,
                  messages: message,
                  notation: {
                    startingFen: ChessFENBoard.STARTING_FEN,
                    history: nextHistory,
                    focusedIndex:
                      FreeBoardHistory.getLastIndexInHistory(nextHistory),
                  },
                },
              },
            },
          };
        } else if (prev.activityState.chaptersMap[0].orientation == 'w') {
          console.log('drugi')
          const toOrientation = 'b';
          return {
            ...prev,
            activityState: {
              ...prev.activityState,
              chaptersMap: {
                ...prev.activityState.chaptersMap,
                [0]: {
                  ...prev.activityState.chaptersMap[0],
                  arrowsMap: {},
                  displayFen: chessGame.fen(),
                  chessAiMode: chessAiMode,
                  orientation: toOrientation,
                  messages: message,
                  notation: {
                    startingFen: ChessFENBoard.STARTING_FEN,
                    history: nextHistory,
                    focusedIndex:
                      FreeBoardHistory.getLastIndexInHistory(nextHistory),
                  },
                },
              },
            },
          };
        }
      }
       console.log('prvi drugi')
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [0]: {
              ...prev.activityState.chaptersMap[0],
              arrowsMap: {},
              displayFen: chessGame.fen(),
              chessAiMode: chessAiMode,
              messages: message,
              notation: {
                startingFen: ChessFENBoard.STARTING_FEN,
                history: nextHistory,
                focusedIndex:
                  FreeBoardHistory.getLastIndexInHistory(nextHistory),
              },
            },
          },
        },
      };
    }

    ///////////// PUZZLE
    if (action.payload.movesCount > 0 && action.payload.goodMoves == 0) {
      const responses =
        chessAiMode.movesCount == 1
          ? [
              'Can you solve this in one move?',
              'Sharpen your mind — one move is all it takes.',
              'Your next move could be the solution. Just one needed!',
              'No room for error — one move, one shot!',
            ]
          : [
              `See if you can find the solution in ${chessAiMode.movesCount} moves`,
              `Try to solve puzzle in ${chessAiMode.movesCount} moves`,
              `Speed run this: solve it in  ${chessAiMode.movesCount} moves!`,
            ];
      const idResponse =
        prev.activityState.chaptersMap[0].messages[
          prev.activityState.chaptersMap[0].messages.length - 1
        ].idResponse;
      const randomIndex = Math.floor(Math.random() * responses.length);
      const message = {
        content: responses[randomIndex],
        participantId: 'chatGPT123456',
        idResponse: idResponse,
      };

      if (action.payload.orientationChange === true) {
        if (prev.activityState.chaptersMap[0].orientation == 'b') {
          const toOrientation = 'w';
          return {
            ...prev,
            activityState: {
              ...prev.activityState,
              chaptersMap: {
                ...prev.activityState.chaptersMap,
                [0]: {
                  ...prev.activityState.chaptersMap[0],
                  displayFen: nextFen,
                  chessAiMode: chessAiMode,
                  orientation: toOrientation,
                  notation: {
                    startingFen: nextFen,
                    history: [],
                    focusedIndex: FreeBoardHistory.getStartingIndex(),
                  },
                  messages: [
                    ...(prev.activityState.chaptersMap[0].messages ?? []),
                    message,
                  ],
                },
              },
            },
          };
        } else {
          const toOrientation = 'b';
          return {
            ...prev,
            activityState: {
              ...prev.activityState,
              chaptersMap: {
                ...prev.activityState.chaptersMap,
                [0]: {
                  ...prev.activityState.chaptersMap[0],
                  displayFen: nextFen,
                  chessAiMode: chessAiMode,
                  orientation: toOrientation,
                  notation: {
                    startingFen: nextFen,
                    history: [],
                    focusedIndex: FreeBoardHistory.getStartingIndex(),
                  },
                  messages: [
                    ...(prev.activityState.chaptersMap[0].messages ?? []),
                    message,
                  ],
                },
              },
            },
          };
        }
      }

      //if set puzzle , message yes no change orientation
      return {
        ...prev,
        activityState: {
          ...prev.activityState,
          chaptersMap: {
            ...prev.activityState.chaptersMap,
            [0]: {
              ...prev.activityState.chaptersMap[0],
              displayFen: nextFen,
              chessAiMode: chessAiMode,
              notation: {
                startingFen: nextFen,
                history: [],
                focusedIndex: FreeBoardHistory.getStartingIndex(),
              },
              messages: [
                ...(prev.activityState.chaptersMap[0].messages ?? []),
                message,
              ],
            },
          },
        },
      };
    }
    // const evaluation = { prevCp: 0, newCp: 0, diffCp: 0 };
    //delete puzzle
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        chaptersMap: {
          ...prev.activityState.chaptersMap,
          [0]: {
            ...prev.activityState.chaptersMap[0],
            chessAiMode: chessAiMode,
            //evaluation: evaluation,
          },
        },
      },
    };
  }

  if (action.type === 'loadedChapter:writeMessage') {
    // if (
    //   prev.activityState.chaptersMap[0].messages[
    //     prev.activityState.chaptersMap[0].messages.length - 1
    //   ].participantId !== action.payload.participantId
    // ) {

    // console.log(action)
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

  // if (action.type === 'loadedChapter:gameEvaluation') {
  //   const prevCp = prev.activityState.chaptersMap[0].evaluation.newCp;
  //   const newCp = action.payload;
  //   const diffCp = prevCp == 0 ? 0 : newCp - prevCp;
  //   return {
  //     ...prev,
  //     activityState: {
  //       ...prev.activityState,
  //       chaptersMap: {
  //         ...prev.activityState.chaptersMap,
  //         [0]: {
  //           ...prev.activityState.chaptersMap[0],
  //           evaluation: {
  //             prevCp: prevCp,
  //             newCp: newCp,
  //             diffCp: diffCp,
  //           },
  //         },
  //       },
  //     },
  //   };
  // }

  return prev;
};
