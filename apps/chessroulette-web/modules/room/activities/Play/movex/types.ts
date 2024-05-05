import { ChessColor, ChessMove, ChessPGN } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';
import { GameState } from '../types';

export type PlayActivityState = {
  activityType: 'play';
  gameState: GameState;
  gameType: GameType;
  activityState: {
    game: {
      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;
      orientation: ChessColor;
      pgn: ChessPGN;
    };
  };
};

export type PlayActivityActions =
  | Action<'play:move', ChessMove>
  | Action<'play:startNewGame'>
  | Action<'play:drawCircle', CircleDrawTuple>
  | Action<'play:clearCircles'>
  | Action<'play:setArrows', ArrowsMap>;
