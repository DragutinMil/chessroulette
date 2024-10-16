import { PlayActivityState } from './types';
import * as PlayStore from '@app/modules/Play/movex';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: PlayStore.initialPlayState,
};
