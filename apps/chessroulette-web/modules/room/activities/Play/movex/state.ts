import { PlayActivityState } from './types';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: {
    game: {
      pgn: '',
      orientation: 'w',
      timeLeft: {
        white: 0,
        black: 0,
      },
      lastMoveBy: 'black',
      lastMoveAt: 0,
      state: 'pending',
    },
    offers: [],
    gameType: 'untimed',
  },
};
