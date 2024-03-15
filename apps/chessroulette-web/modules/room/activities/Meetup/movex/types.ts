import { ChessColor, ChessMove, ChessPGN, FBHIndex } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';
import { ChapterBoardState } from '../../Learn/movex';

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
    game: {
      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;
      orientation: ChessColor;
      pgn: ChessPGN;
    };
  };
};

export type MeetupActivityActions =
  | Action<'meetup:move', ChessMove>
  | Action<'meetup:startNewGame'>
  | Action<'meetup:drawCircle', CircleDrawTuple>
  | Action<'meetup:clearCircles'>
  | Action<'meetup:setArrows', ArrowsMap>;
