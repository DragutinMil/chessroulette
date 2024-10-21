import { Action } from 'movex-core-util';
import { ChessColor, ChessMove } from '@xmatter/util-kit';
import { User } from '@app/modules/user';
import { AbortedGame, CompletedGame, Game, GameOffer } from '@app/modules/Game';
import { PlayerId, PlayerInfo, PlayersBySide } from '../types';

export type PlayOffer = {
  by: ChessColor;
  type: 'takeback' | 'draw' | 'rematch';
};

export type PlayState = {
  game: Game;
  // players: PlayersByColor;
  offer?: PlayOffer;
};

export type PlayersByColor = {
  w: PlayerId;
  b: PlayerId;
};

export type CompletedPlayState = { game: CompletedGame };
export type AbortedPlayState = { game: AbortedGame };
export type EndedPlayState = CompletedPlayState | AbortedPlayState;

export type PlayActions =
  | Action<'play:startWhitePlayerIdlingTimer', { at: number }>
  | Action<
      'play:move',
      ChessMove & {
        moveAt: number;
      }
    >
  | Action<'play:checkTime', { at: number }>
  // | Action<'play:timeout', { color: ChessColor }>
  // TODO: Add this feature in
  //  When the timer runs out in the UI or they press the abort button, move the game to abort!

  //TODO - do we need a color here? as there's no winner for an aborted game, it doesn't really matter who aborts, or am I missing something?
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
