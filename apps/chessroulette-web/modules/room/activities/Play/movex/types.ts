import * as PlayStore from '@app/modules/Play/movex';

export type PlayActivityState = {
  activityType: 'play';
  activityState: PlayStore.PlayState;
};

export type PlayActivityActions = PlayStore.PlayActions;
