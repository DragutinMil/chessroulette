import {
  ChessColor,
  ChessMove,
  ChessPGN,
  LongChessColor,
} from '@xmatter/util-kit';
import { Action } from 'movex-core-util';
import { GameStatus, GameTimeClass } from '../types';
import { User } from 'apps/chessroulette-web/modules/user/type';

type GameStateWinner = 'white' | 'black' | '1/2';

export type GameOffer = {
  // TODO: this should not be byPlayer but byColor, since inside the Game there is no notion of player but just of color
  byPlayer: User['id'];

  //TODO - probably need toParticipant as well, but not sure how to get it now
  type: 'takeback' | 'draw' | 'rematch';
  status: 'pending' | 'accepted' | 'denied' | 'cancelled';

  // Nededed? If so change to Date or smtg
  timestamp?: number;
};

export type Game = {
  pgn: ChessPGN;
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  lastMoveBy: LongChessColor;
  lastMoveAt: number;
  status: GameStatus;
  winner?: GameStateWinner;

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

export type PlayState = {
  game: Game;
  // gameTimeClass: GameTimeClass;
  gameOffers: GameOffer[];
};

export type PlayActions =
  | Action<
      'play:move',
      ChessMove & {
        moveAt: number;
      }
    >
  | Action<'play:setGameTimeClass', GameTimeClass>
  | Action<'play:timeout'>
  | Action<'play:resignGame', { color: ChessColor }>
  | Action<
      'play:sendOffer',
      {
        byPlayer: User['id'];
        offerType: GameOffer['type'];
        timestamp?: number;
      }
    >
  | Action<'play:acceptOfferDraw'>
  | Action<'play:acceptOfferRematch'>
  | Action<'play:acceptTakeBack'>
  | Action<'play:denyOffer'>
  | Action<'play:cancelOffer'>;
