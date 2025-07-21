import {
  ChessColor,
  ChessFEN,
  ChessPGN,
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

import { Square } from 'chess.js';


export type AichessActivityState = {
  activityType: 'aichess';
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


export type MovePiece = {
  from: Square;
  to: Square;
};

export type chessAiMode = {
  mode:string,
  moves: string[];
  movesCount: number;
  badMoves: number;
  goodMoves: number;
  orientationChange: Boolean;
};
export type Message = {
  content: string;
  participantId: string;
  idResponse: string;
};

export type ChapterState = {
  name: string;
  messages: Message[];
  // Also the chapter might get a type: position, or puzzle (containing next correct moves)
  chessAiMode: chessAiMode;
  pgn: ChessPGN;
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

  fenPreviusMove:ChessFEN,
  //pgn:ChessPGN,
  arrowsMap: ArrowsMap;
  chessAiMode: chessAiMode;
  circlesMap: CirclesMap;
  orientation: ChessColor;


};

export type AichessActivityActions =
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

  | Action<'loadedChapter:setPuzzleMoves', chessAiMode>
  | Action<'loadedChapter:writeMessage', Message>

  | Action<'loadedChapter:focusHistoryIndex', FBHIndex>
  | Action<'loadedChapter:deleteHistoryMove', FBHIndex>
  | Action<'loadedChapter:drawCircle', CircleDrawTuple>
  | Action<'loadedChapter:clearCircles'>
  | Action<'loadedChapter:setArrows', ArrowsMap>
  | Action<'loadedChapter:setOrientation', { color: ChessColor }>
  | Action<'loadedChapter:takeBack'>
  | Action<'loadedChapter:updateFen', ChessFEN>
  | Action<'loadedChapter:import', { input: ImportedInput }>;
