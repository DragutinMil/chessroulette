import { FreeBoardHistory } from '@xmatter/util-kit';
import type { Chapter, ChapterState, DailyLessonActivityState } from './types';
import {
  DEFAULT_LESSON_ID,
  findLesson,
  findLessonStep,
} from '../lessonDatabase';

/** Gradi pocetno stanje sobe za dati lesson - podrazumeva DEFAULT_LESSON_ID
 * (Rook, Day 1) ako lessonId nije prosledjen ili ne postoji u bazi. */
export const createDailyLessonActivityState = (
  lessonId?: string
): DailyLessonActivityState => {
  const resolvedLessonId =
    lessonId && findLesson(lessonId) ? lessonId : DEFAULT_LESSON_ID;
  const firstStep = findLessonStep(resolvedLessonId, 0);
  const initialFen = firstStep?.fen ?? '';
  const initialOrientation = firstStep?.orientation ?? 'w';

  const chapterState: ChapterState = {
    name: 'New Chapter', // TODO: Should it have a name?
    displayFen: initialFen,
    arrowsMap: {},
    circlesMap: {},
    messages: [],
    dailyLesson: {
      lessonId: resolvedLessonId,
      stepIndex: 0,
      progress: 0,
      errors: 0,
      hints: 0,
      completed: false,
      popup: false,
    },
    notation: {
      history: [],
      focusedIndex: FreeBoardHistory.getStartingIndex(),
      startingFen: initialFen,
    },
    orientation: initialOrientation,
  };

  const defaultChapter: Chapter = {
    ...chapterState,
    name: 'Chapter 1',
    id: '0',
  };

  return {
    activityType: 'dailylesson',
    activityState: {
      chaptersMap: {
        [defaultChapter.id]: defaultChapter,
      },
      loadedChapterId: defaultChapter.id,
      chaptersIndex: 1,
    },
  };
};

export const initialChapterState: ChapterState =
  createDailyLessonActivityState().activityState.chaptersMap['0'];

export const initialDefaultChapter: Chapter = {
  ...initialChapterState,
  name: 'Chapter 1',
  id: '0',
};

export const initialDailyLessonStateActivityState: DailyLessonActivityState['activityState'] =
  createDailyLessonActivityState().activityState;

export const initialDailyLessonActivityState: DailyLessonActivityState =
  createDailyLessonActivityState();
