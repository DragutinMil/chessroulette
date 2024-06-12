import {
  ChessColor,
  ChessMove,
  ChessPGN,
  LongChessColor,
} from '@xmatter/util-kit';
import { Action } from 'movex-core-util';
import { GameStatus, GameType } from '../types';
import { User } from 'apps/chessroulette-web/modules/user/type';

type GameStateWinner = 'white' | 'black' | '1/2';
export type OfferType = 'takeback' | 'draw' | 'rematch';
export type OfferStatus = 'pending' | 'accepted' | 'denied' | 'cancelled';
export type Offer = {
  byPlayer: User['id'];
  //TODO - probably need toParticipant as well, but not sure how to get it now
  offerType: OfferType;
  status: OfferStatus;
  timestamp?: number;
};

export type Game = {
  orientation: ChessColor;
  pgn: ChessPGN;
  timeLeft: {
    white: number;
    black: number;
  };
  lastMoveBy: LongChessColor;
  lastMoveAt: number;
  status: GameStatus;
  winner?: GameStateWinner;
};

export type PlayState = {
  game: Game;
  gameType: GameType;
  offers: Offer[];
};

export type PlayActions =
  | Action<
      'play:move',
      ChessMove & {
        moveAt: number;
      }
    >
  | Action<'play:setGameType', { gameType: GameType }>
  | Action<'play:timeout'>
  | Action<'play:resignGame', { color: ChessColor }>
  | Action<
      'play:sendOffer',
      {
        byPlayer: User['id'];
        offerType: OfferType;
        timestamp?: number;
      }
    >
  | Action<'play:acceptOfferDraw'>
  | Action<'play:acceptOfferRematch'>
  | Action<'play:acceptTakeBack'>
  | Action<'play:denyOffer'>
  | Action<'play:cancelOffer'>;
