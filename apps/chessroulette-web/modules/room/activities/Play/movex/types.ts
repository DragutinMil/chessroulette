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
import { User } from 'apps/chessroulette-web/modules/user/type';

type GameStateWinner = 'white' | 'black' | '1/2';
export type OfferType = 'takeback' | 'draw' | 'rematch';
export type OfferStatus = 'pending' | 'accepted' | 'denied' | 'cancelled';
export type Offer = {
  byParticipant: User['id'];
  //TODO - probably need toParticipant as well, but not sure how to get it now
  offerType: OfferType;
  status: OfferStatus;
};

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
    offers: Offer[];
  };
};

export type PlayActivityActions =
  | Action<'play:move', ChessMoveWithTime>
  | Action<'play:setGameType', { gameType: GameType }>
  | Action<'play:timeout'>
  | Action<'play:startNewGame', { gameType: GameType }>
  | Action<'play:resignGame', { color: ChessColor }>
  | Action<
      'play:sendOffer',
      {
        byParticipant: User['id'];
        offerType: OfferType;
      }
    >
  | Action<'play:acceptOfferDraw'>
  | Action<'play:acceptOfferRematch'>
  | Action<'play:acceptTakeBack'>
  | Action<'play:denyOffer'>
  | Action<'play:cancelOffer'>
  | Action<'play:drawCircle', CircleDrawTuple>
  | Action<'play:clearCircles'>
  | Action<'play:setArrows', ArrowsMap>;
