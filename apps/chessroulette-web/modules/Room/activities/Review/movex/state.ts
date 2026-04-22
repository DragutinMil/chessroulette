import { ChessFENBoard, FreeBoardHistory, ChessPGN } from '@xmatter/util-kit';
import type { Chapter, ChapterState, ReviewActivityState } from './types';
//import { number } from 'zod';

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.EMPTY_FEN,
  arrowsMap: {},
  circlesMap: {},
  messages: [
    {
      content: 'Hi there! 👋  Ready for exercise?',
      idResponse: '',
      participantId: 'chatGPT123456',
    },
  ],
  chessAiMode: {
    mode: '',
    orientationChange: false,
    review: [],
    fen: ChessFENBoard.EMPTY_FEN,
    originalPGN: '',
    opponentName: '',
    opponentColor: '',
    responseId: '',
    message: '',
  },

  notation: {
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    startingFen: ChessFENBoard.EMPTY_FEN,
  },
  orientation: 'w',
};

// export const initialFreeChapter = { ...initialChapterState, name: '' };

export const initialDefaultChapter: Chapter = {
  ...initialChapterState,
  name: 'Chapter 1',
  id: '0',
};

export const initialReviewStateActivityState: ReviewActivityState['activityState'] =
  {
    chaptersMap: {
      [initialDefaultChapter.id]: initialDefaultChapter,
    },
    loadedChapterId: initialDefaultChapter.id,
    chaptersIndex: 1,
  };

export const initialReviewActivityState: ReviewActivityState = {
  activityType: 'review',
  activityState: initialReviewStateActivityState,
};
