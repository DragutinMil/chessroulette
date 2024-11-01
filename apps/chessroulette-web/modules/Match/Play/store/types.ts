import { Action } from 'movex-core-util';
import { ChessColor, ChessMove, ShortChessColor } from '@xmatter/util-kit';
import { User } from '@app/modules/User';
import { Game, GameOffer } from '@app/modules/Game';

export type PlayOffer = {
  by: ShortChessColor;
  type: 'takeback' | 'draw' | 'rematch';
};

export type PlayActions =
  | Action<
      'play:start',
      {
        at: number;
        players: NonNullable<Game['players']>;
      }
    >
  | Action<
      'play:move',
      ChessMove & {
        moveAt: number;
      }
    >
  | Action<'play:checkTime', { at: number }>
  | Action<'play:abortGame', { color: ChessColor }>
  | Action<'play:resignGame', { color: ChessColor }>

  // Play Offers
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
