import { PlayActivityState } from './types';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  gameType: 'untimed',
  activityState: {
    game: {
      arrowsMap: {},
      circlesMap: {},
      pgn: '',
      orientation: 'w',
    },
    gameState: 'pending',
  },
};
