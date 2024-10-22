import { PlayActivityState } from './types';
import * as PlayStore from '@app/modules/Match/Play/movex';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: PlayStore.initialPlayState,
};
