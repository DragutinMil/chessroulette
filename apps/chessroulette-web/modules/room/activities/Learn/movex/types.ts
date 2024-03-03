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
} from 'apps/chessroulette-web/components/Chessboard/types';
import { ImportedInput } from 'apps/chessroulette-web/components/PgnInputBox';
import { Action } from 'movex-core-util';

export type LearnActivityState = {
  activityType: 'learn';
  activityState: {
    loadedChapterId: Chapter['id'];
    chaptersMap: Record<Chapter['id'], Chapter>;
    chaptersIndex: number;
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
  // createdAt: number;
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
  | Action<'loadedChapter:focusHistoryIndex', FBHIndex>
  | Action<'loadedChapter:deleteHistoryMove', FBHIndex>
  | Action<'loadedChapter:drawCircle', CircleDrawTuple>
  | Action<'loadedChapter:clearCircles'>
  | Action<'loadedChapter:setArrows', ArrowsMap>
  | Action<'loadedChapter:setOrientation', ChessColor>
  | Action<'loadedChapter:updateFen', ChessFEN>
  | Action<'loadedChapter:import', ImportedInput>;
