import { PlayActivityState } from './types';
import * as PlayStore from '@app/modules/Match/Play/store';

export const initialPlayActivityState: PlayActivityState = {
  activityType: 'play',
  activityState: { game: PlayStore.initialPlayState },
};
