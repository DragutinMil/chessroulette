import { ChessColor, ChessMove, ChessPGN, FBHIndex } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from '@app/components/Chessboard/types';
import { Action } from 'movex-core-util';
import { ChapterBoardState } from '../../Learn/movex';
import { MatchActions, MatchState } from '@app/modules/Match/movex';

// export type GameNotation = {
//   pgn: ChessPGN;
//   focusedIndex: FBHIndex;
// };
// export type Game = ChapterBoardState & {
//   notation: GameNotation;
//   pgn: ChessPGN;
// };

export type MeetupActivityState = {
  activityType: 'meetup';
  activityState: {
    match: MatchState;
  };
};

export type MeetupActivityActions = MatchActions;
  // | Action<'meetup:move', ChessMove>
  // | Action<'meetup:startNewGame'>
  // | Action<'meetup:drawCircle', CircleDrawTuple>
  // | Action<'meetup:clearCircles'>
  // | Action<'meetup:setArrows', ArrowsMap>;
