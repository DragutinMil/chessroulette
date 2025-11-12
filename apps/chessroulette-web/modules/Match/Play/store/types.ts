import { Action } from 'movex-core-util';
import { ChessColor, ChessMove, ShortChessColor } from '@xmatter/util-kit';
import { User } from '@app/modules/User';
import { Game, GameOffer } from '@app/modules/Game';

export type PlayOffer = {
  by: ShortChessColor;
  type: 'takeback' | 'draw' | 'rematch';
};

export type PlayActions =
  | Action<'increment'>
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
  | Action<'play:abandonGame', { playerId: User['id'] }>
  | Action<'play:resumeAbandonedGame'>
  | Action<'play:completeAbandonedGame', { at: number }>
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
  | Action<
      'play:acceptOfferRematch',
      { target_url: string; initiator_url: string }
    >
  | Action<'play:acceptTakeBack'>
  | Action<'play:denyOffer'>
  // | Action<'play:rematchOffer'>
  | Action<'play:cancelOffer'>
  | Action<
      'play:sendMessage',
      {
        senderId: User['id'];
        content: string;
        timestamp: number;
      }
    >;
