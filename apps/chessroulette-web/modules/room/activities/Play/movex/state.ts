import { PlayActivityState } from './types';
import { PlayStore } from '@app/modules/Play';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: PlayStore.initialPlayState,
};
