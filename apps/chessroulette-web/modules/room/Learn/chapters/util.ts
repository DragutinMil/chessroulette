import { Chapter, ChapterState } from '../../activity/reducer';

// export const toChapterState = (c: Chapter): ChapterState => {
//   const { id, ...chapterState } = c;

//   return chapterState;
// };

// TODO: Ensure this is enough for proper equality
export const areChapterStatesEqual = (a: ChapterState, b: ChapterState) =>
  a.displayFen === b.displayFen &&
  a.name === b.name &&
  a.arrowsMap === b.arrowsMap &&
  a.circlesMap === b.circlesMap;
