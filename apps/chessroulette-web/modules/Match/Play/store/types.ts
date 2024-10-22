import { Action } from 'movex-core-util';
import { ChessColor, ChessMove, ShortChessColor } from '@xmatter/util-kit';
import { User } from '@app/modules/User';
import {
  AbortedGame,
  CompletedGame,
  Game,
  GameOffer,
  IdlingGame,
  OngoingGame,
  PendingGame,
} from '@app/modules/Game';
import { PlayerId } from '../types';

// type BasePlayState = {
//   // players: PlayersByColor;
//   offer?: PlayOffer;
// };

export type PlayersByColor = {
  white: { id: PlayerId };
  black: { id: PlayerId };
};

export type PlayOffer = {
  by: ShortChessColor;
  type: 'takeback' | 'draw' | 'rematch';
};

// TODO: Is there no better way to define these?
// export type IdlingPlayState = BasePlayState & { game: IdlingGame };
// export type PendingPlayState = BasePlayState & { game: PendingGame };
// export type OngoingPlayState = BasePlayState & { game: OngoingGame };
// export type CompletedPlayState = BasePlayState & { game: CompletedGame };
// export type AbortedPlayState = BasePlayState & { game: AbortedGame };

// export type EndedPlayState = CompletedPlayState | AbortedPlayState;

// export type PlayState = BasePlayState & { game: Game };
// | IdlingPlayState
// | PendingPlayState
// | OngoingPlayState
// | EndedPlayState;

export type PlayActions =
  | Action<
      'play:start',
      {
        at: number;
        challengerColor: ShortChessColor;
      }
    >
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
