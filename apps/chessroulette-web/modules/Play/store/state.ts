import { PendingGame, PlayState } from './types';

export const PENDING_UNTIMED_GAME: PendingGame = {
  status: 'pending',
  winner: null,
  startedAt: null,
  pgn: '',
  orientation: 'w',
  timeLeft: {
    white: 0,
    black: 0,
  },
  lastMoveBy: 'black',
  lastMoveAt: null,
  timeClass: 'untimed',

  // TODO: This doesn't need to be an array and it doesn't need to be always defined
  offers: [],
};

export const initialPlayState: PlayState = {
  game: PENDING_UNTIMED_GAME,
};
