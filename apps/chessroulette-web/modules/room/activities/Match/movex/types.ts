import { PlayStore } from 'apps/chessroulette-web/modules/Play';

export type MatchActivityState = {
  activityType: 'match';
  activityState: PlayStore.PlayState;
};

export type MatchActivityActions = PlayStore.PlayActions; // TODO: add the match specifc
