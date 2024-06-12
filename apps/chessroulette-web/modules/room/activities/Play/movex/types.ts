import { PlayStore } from 'apps/chessroulette-web/modules/Play';

export type PlayActivityState = {
  activityType: 'play';
  activityState: PlayStore.PlayState;
};

export type PlayActivityActions = PlayStore.PlayActions;
