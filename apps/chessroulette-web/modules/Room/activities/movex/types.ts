import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';

import type {
  MeetupActivityState,
  MeetupActivityActions,
} from '../Meetup/movex';
import { MatchActivityActions, MatchActivityState } from '../Match/movex';
import { AichessActivityState ,AichessActivityActions } from '../Aichess/movex';

export type NoneActivityState = {
  activityType: 'none';
  activityState: {};
};

export type ActivityState =
  | LearnActivityState
  | MeetupActivityState
  | NoneActivityState
  | MatchActivityState
  | AichessActivityState;

export type ActivityActions =
  | LearnActivityActions
  | MeetupActivityActions
  | MatchActivityActions
  | AichessActivityActions;
