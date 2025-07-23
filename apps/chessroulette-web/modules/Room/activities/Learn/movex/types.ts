import {
  ChessColor,
  ChessFEN,
  ChessMove,
  FBHHistory,
  FBHIndex,
} from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from '@app/components/Chessboard/types';
import { ImportedInput } from '@app/components/PgnInputBox/PgnInputBox';
import { Action } from 'movex-core-util';

export type LearnActivityState = {
  activityType: 'learn';
  activityState: {
    // TODO: This is the LessonModel induced LessonState
    loadedChapterId: Chapter['id'];
    chaptersMap: Record<Chapter['id'], Chapter>;
    // TODO: This should only be last chapter Index or smtg like that, because otherwise it skips counts if deleting the last one
    chaptersIndex: number;
  };
};

export type Chapter = {
  id: string;
  // createdAt: number;
} & ChapterState;

export type ChapterState = {
  name: string;
  // Also the chapter might get a type: position, or puzzle (containing next correct moves)
  messages: Message[];
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
  arrowsMap: ArrowsMap;
  circlesMap: CirclesMap;
  orientation: ChessColor;
};
export type Message = {
  content: string;
  participantId: string;
  idResponse: string;
};

export type LearnActivityActions =
  // Chapter Logistcs
  | Action<'createChapter', ChapterState>
  | Action<
      'updateChapter',
      {
        id: Chapter['id'];
        state: Partial<ChapterState>; // The notation is updateable via addMove or history actions only
      }
    >
  | Action<'deleteChapter', { id: Chapter['id'] }>
  | Action<'loadChapter', { id: Chapter['id'] }>
  | Action<'loadedChapter:addMove', ChessMove>
  | Action<'loadedChapter:writeMessage', Message>
  | Action<'loadedChapter:focusHistoryIndex', FBHIndex>
  | Action<'loadedChapter:deleteHistoryMove', FBHIndex>
  | Action<'loadedChapter:drawCircle', CircleDrawTuple>
  | Action<'loadedChapter:clearCircles'>
  | Action<'loadedChapter:setArrows', ArrowsMap>
  | Action<'loadedChapter:setOrientation', { color: ChessColor }>
  | Action<'loadedChapter:updateFen', ChessFEN>
  | Action<'loadedChapter:import', { input: ImportedInput }>;
