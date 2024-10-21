import { ChessColor, ChessPGN, LongChessColor } from '@xmatter/util-kit';
import { User } from '@app/modules/user/type';
import { GameTimeClass } from '../Play';

export type GameStateWinner = 'white' | 'black' | '1/2';

export enum GameOverReason {
  'timeout',
  'checkmate',
  'draw',
  'stalemate',
  'insufficientMaterial',
  'threefoldRepetition',
  'resignation',
  'acceptedDraw',
  'aborted',
}

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
  startedAt: null;
  timeClass: GameTimeClass;

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: null;
    white: number;
    black: number;
  };
  pgn: '';
  lastMoveBy: 'black'; // This can be undefined as well
  lastMoveAt: null;
  winner: null;
  offers: GameOffer[]; // TODO: Make this undefined

  gameOverReason: null;

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

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: null; // TODO: Change this to ISODateTime
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  // This is number in case white made its first move and waiting for black, or undefined otherwise
  lastMoveAt: number | null; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[]; // TODO: Make this undefined

  gameOverReason: null;

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

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number; // this is the same as lastMoveAt but can be different as well
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[];

  gameOverReason: null;

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

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number; // this is the same as lastMoveAt but can be different as well
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  lastMoveAt: number; // TODO: Change this to ISODateTime
  winner: GameStateWinner;
  offers: GameOffer[];

  gameOverReason: GameOverReason;

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

  // Since lastActivity
  timeLeft: {
    lastUpdatedAt: number | null; // this is the same as lastMoveAt but can be different as well
    white: number;
    black: number;
  };
  pgn: ChessPGN;
  lastMoveBy: LongChessColor;
  // This is number in case white made its first move and waiting for black, or undefined otherwise
  lastMoveAt: number | null; // TODO: Change this to ISODateTime
  winner: null;
  offers: GameOffer[];

  gameOverReason: null;

  // TODO: Is this needed here???
  // @deprecate as each player can chose individualy
  orientation: ChessColor;
};

export type Game =
  | PendingGame
  | IdlingGame
  | OngoingGame
  | CompletedGame
  | AbortedGame;
