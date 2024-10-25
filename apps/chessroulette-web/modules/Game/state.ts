import { PendingGame } from './types';

export const PENDING_UNTIMED_GAME: PendingGame = {
  status: 'pending',
  winner: null,
  startedAt: null,
  pgn: '',
  orientation: 'w',
  timeLeft: {
    lastUpdatedAt: null,
    white: 0,
    black: 0,
  },
  lastMoveBy: 'black',
  lastMoveAt: null,
  timeClass: 'untimed',
  gameOverReason: null,

  // players: null,
  // TODO: Should this be a color? or be null here?
  challengerColor: 'w',

  // TODO: This doesn't need to be an array and it doesn't need to be always defined
  offers: [],

  players: {
    white: 'N/A',
    black: 'N/A',
  },
};
