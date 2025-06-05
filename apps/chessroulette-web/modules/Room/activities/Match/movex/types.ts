import { MatchActions, MatchState } from '@app/modules/Match/movex';
import { CounterActions } from '../counter';

export type MatchActivityActivityState = MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
  increment:number
};

export type MatchActivityActions = MatchActions | CounterActions;
