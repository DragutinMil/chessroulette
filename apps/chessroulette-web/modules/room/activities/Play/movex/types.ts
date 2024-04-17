import { ChessColor, ChessMove, ChessPGN } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';
import { GameState, GameType } from '../types';

export type PlayActivityState = {
  activityType: 'play';
  activityState: {
    game: {
      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;
      orientation: ChessColor;
      pgn: ChessPGN;
    };
    gameState: GameState;
  };
};

export type PlayActivityActions =
  | Action<'play:move', ChessMove>
  | Action<'play:startNewGame'>
  | Action<'play:drawCircle', CircleDrawTuple>
  | Action<'play:clearCircles'>
  | Action<'play:setArrows', ArrowsMap>;
