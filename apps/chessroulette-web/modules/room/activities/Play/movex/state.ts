import { PlayActivityState } from './types';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  gameState: 'pending',
  activityState: {
    game: {
      arrowsMap: {},
      circlesMap: {},
      pgn: '',
      orientation: 'w',
    },
  },
};
