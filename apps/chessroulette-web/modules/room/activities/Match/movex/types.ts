import { MatchActions, MatchState } from '@app/modules/Match';

export type MatchActivityActivityState = MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
};

export type MatchActivityActions = MatchActions;
