import { Game, PlayState } from './types';

export const UNSTARTED_UNTIMED_GAME: Game = {
  pgn: '',
  orientation: 'w',
  timeLeft: {
    white: 0,
    black: 0,
  },
  lastMoveBy: 'black',
  lastMoveAt: 0,
  status: 'pending',
  timeClass: 'untimed',

  // TODO: This doesn't need to be an array and it doesn't need to be always defined
  offers: [],
};

export const initialPlayState: PlayState = {
  game: UNSTARTED_UNTIMED_GAME,
};
