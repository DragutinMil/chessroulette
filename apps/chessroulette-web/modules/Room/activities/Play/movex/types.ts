import * as PlayStore from '@app/modules/Match/Play/store';

export type PlayActivityState = {
  activityType: 'play';
  // activityState: PlayStore.PlayState;
  activityState: any;
};

export type PlayActivityActions = PlayStore.PlayActions;
