import * as PlayStore from '@app/modules/Match/Play/movex';

export type PlayActivityState = {
  activityType: 'play';
  activityState: PlayStore.PlayState;
};

export type PlayActivityActions = PlayStore.PlayActions;
