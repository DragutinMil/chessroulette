import { ChessFEN, ChessMove, FBHHistory, FBHIndex } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';

export type MeetupActivityState = {
  activityType: 'meetup';
  activityState: {
    game: {
      // Board State
      displayFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily

      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;

      // TODO: This make required once refactored
      // orientation: ChessColor;
      notation: {
        // The starting fen is the chapter fen
        history: FBHHistory;
        focusedIndex: FBHIndex;
        startingFen: ChessFEN; // This could be strtingPGN as well especially for puzzles but not necessarily
      };
    };
  };
};

export type MeetupActivityActions = Action<'meetup:move', ChessMove>;
