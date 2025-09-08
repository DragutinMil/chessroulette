import { ChessFENBoard, FreeBoardHistory, ChessPGN } from '@xmatter/util-kit';
import type { Chapter, ChapterState, AichessActivityState } from './types';
//import { number } from 'zod';

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  messages: [
    // {
    //   content: 'Hi there! 👋  Ready for exercise?',
    //   idResponse: '',
    //   participantId: 'chatGPT123456',
    // },
  ],
  chessAiMode: {
    mode: '',
    moves: [],
    movesCount: 0,
    badMoves: 0,
    goodMoves: 0,
    orientationChange: false,
    puzzleRatting: 0,
    userPuzzleRating: 0,
    ratingChange: 0,
    puzzleId: 0,
    prevUserPuzzleRating: 0,
    fen: ChessFENBoard.STARTING_FEN,
    responseId: '',
    message: '',
  },
  evaluation: {
    prevCp: 0,
    newCp: 0,
    diffCp: 0,
  },
  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.STARTING_FEN,
  },
  orientation: 'w',
};

// export const initialFreeChapter = { ...initialChapterState, name: '' };

export const initialDefaultChapter: Chapter = {
  ...initialChapterState,
  name: 'Chapter 1',
  id: '0',
};

export const initialAichessStateActivityState: AichessActivityState['activityState'] =
  {
    chaptersMap: {
      [initialDefaultChapter.id]: initialDefaultChapter,
    },
    loadedChapterId: initialDefaultChapter.id,
    chaptersIndex: 1,
  };

export const initialAichessActivityState: AichessActivityState = {
  activityType: 'aichess',
  activityState: initialAichessStateActivityState,
};
