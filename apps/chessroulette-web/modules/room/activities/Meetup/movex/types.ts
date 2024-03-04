import { ChessColor, ChessMove, ChessPGN } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';

export type MeetupActivityState = {
  activityType: 'meetup';
  activityState: {
    game: {
      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;
      pgn: ChessPGN;
      orientation: ChessColor;
    };
  };
};

export type MeetupActivityActions =
  | Action<'meetup:move', ChessMove>
  | Action<'meetup:startNewGame'>;
