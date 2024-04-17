import { PlayActivityState } from './types';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
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
