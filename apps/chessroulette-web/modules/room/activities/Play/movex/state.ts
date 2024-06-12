import { PlayActivityState } from './types';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: PlayStore.initialPlayState,
};
