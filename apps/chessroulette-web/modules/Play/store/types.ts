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

/**
 * A Game That is not yet started or idling (maybe the players haven't joined yet)
 */
export type PendingGame = {
  status: 'pending';
  startedAt: undefined;
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  pgn: '';
  lastMoveBy: 'black'; // This can be undefined as well
  lastMoveAt: undefined;
  winner: undefined;
  offers: GameOffer[]; // TODO: Make this undefined

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

/**
 * A Pending Game moves into Idling based on a certain Event (e.g such as both players joined or at a certain date/time)
 *
 * This State is needed in order to allow a certain period of Idle time to make a move, without the players to incurr a game loss
 */
export type IdlingGame = {
  status: 'idling';
  // This reflects when the Game has Started - as Idle First
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: undefined;
  offers: GameOffer[]; // TODO: Make this undefined

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

/**
 * Idling to Ongoing
 *
 * Once both players made their first move (aka after first black move) the Game moves to Ongoing
 */
export type OngoingGame = {
  status: 'ongoing';
  // This reflects when the Game has Started - as Idle First and then Ongoing
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: undefined;
  offers: GameOffer[];

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

/**
 * Ongoing to Complete
 *
 * Once the game finishes or one of players runs out of time (triggered externally)
 */
export type CompletedGame = {
  status: 'complete';
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: GameStateWinner;
  offers: GameOffer[];

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

/**
 * Idling to Aborted
 *
 * A game can only be aborted if the idling period ran out before the players made a first move
 *
 * How To Check if a Game isAborted?
 * - for white: now() > game.startedAt + iddleTime (10% of timeClass)
 * - for black: now() > game.lastMoveAtAt + iddleTime (10% of timeClass)
 */
export type AbortedGame = {
  status: 'aborted';
  startedAt: number; // Change this to ISODateTime
  timeClass: GameTimeClass;
  timeLeft: {
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: undefined;
  offers: GameOffer[];

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

/**
 * Few notes about the game
 *
 * The Game State can be updated by a Movex Client sending an ACTION (e..g a time finished action) but this is not always reliable
 * especially if that client has left the game room.
 *
 * An ideal scenario is where these actions get triggered by the server, but that is more consuming and complicated.
 *
 * So a third option is an interesting idea, where the states get calculated on demand:
 *    - whenever the state is read, a certain type of actions can be dispatched to the reducer to change the state like for ex.
 *       - to check if an ongoing game is still ongoing or did the timers finished and it can move to completed
 *       - or to check if an idling game is still idling or it moved into ongoing or aborted
 *  Actually, after thinking more of this it doesn't need to be an ACTION but a transformer (like getDerivedState) that gets calculated (and memoized) 
 *   on each read, so it always returns the calculated version!
 *    - the downside to this is that it doesn't get saved in the Movex Store, but memoized or run multiple times, but is this a real downside?
 *    - Movex Can still show both versions, and the cached/memoized version is stored in just another store - or the same? :)
 */
export type Game =
  | PendingGame
  | IdlingGame
  | OngoingGame
  | CompletedGame
  | AbortedGame;

export type PlayState = {
  game: Game;
};

export type PlayActions =
  | Action<
      'play:move',
      ChessMove & {
        moveAt: number;
      }
    >
  | Action<'play:timeout'>
  // TODO: Add this feature in
  //  When the timer runs out in the UI or they press the abort button, move the game to abort!
  | Action<'play:abortGame', { color: ChessColor }>
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
