import { ChessColor, ChessMove, ChessPGN, FBHIndex } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from '@app/components/Chessboard/types';
import { Action } from 'movex-core-util';


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
