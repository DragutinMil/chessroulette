import { PlayState } from './types';

export const initialPlayState: PlayState = {
  game: {
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
  },
  gameOffers: [],
};
