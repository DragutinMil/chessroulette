import { ChessFENBoard, FreeBoardHistory, ChessPGN } from '@xmatter/util-kit';
import type { Chapter, ChapterState, LearnAiActivityState } from './types';
//import { number } from 'zod';

export const initialChapterState: ChapterState = {
  name: 'New Chapter', // TODO: Should it have a name?
  displayFen: ChessFENBoard.STARTING_FEN,
  arrowsMap: {},
  circlesMap: {},
  messages: [
    {
      content: 'Hi, are you ready to study?',
      idResponse: '',
      participantId: 'chatGPT123456',
    },
  ],
  aiLearn: {
    mode: 'opening',
    name: '',
    // uci:'',
    moves: [],
    popup: false,
    orientationChange: false,
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

export const initialLearnAiStateActivityState: LearnAiActivityState['activityState'] =
  {
    chaptersMap: {
      [initialDefaultChapter.id]: initialDefaultChapter,
    },
    loadedChapterId: initialDefaultChapter.id,
    chaptersIndex: 1,
  };

export const initialLearnAiActivityState: LearnAiActivityState = {
  activityType: 'ailearn',
  activityState: initialLearnAiStateActivityState,
};
