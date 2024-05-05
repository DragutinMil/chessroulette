import {
  ChessColor,
  ChessMoveWithTime,
  ChessPGN,
  LongChessColor,
} from '@xmatter/util-kit';
import {
  ArrowsMap,
  CircleDrawTuple,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';
import { Action } from 'movex-core-util';
import { GameState, GameType } from '../types';

type GameStateWinner = 'white' | 'black' | '1/2';
type GameFinishResult = 'timeout' | 'mate' | 'resign' | 'draw';

export type PlayActivityState = {
  activityType: 'play';
  activityState: {
    game: {
      arrowsMap: ArrowsMap;
      circlesMap: CirclesMap;
      orientation: ChessColor;
      pgn: ChessPGN;
      timeLeft: {
        white: number;
        black: number;
      };
      lastMoveBy: LongChessColor;
      lastMoveAt: number;
      state: GameState;
      winner?: GameStateWinner;
    };
    gameType: GameType;
  };
};

export type PlayActivityActions =
  | Action<'play:move', ChessMoveWithTime>
  | Action<'play:setGameType', { gameType: GameType }>
  | Action<'play:setGameComplete', { result: GameFinishResult }>
  | Action<'play:startNewGame'>
  | Action<'play:drawCircle', CircleDrawTuple>
  | Action<'play:clearCircles'>
  | Action<'play:setArrows', ArrowsMap>;
