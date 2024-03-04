import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
import type {
  MeetupActivityState,
  MeetupActivityActions,
} from '../Meetup/movex';

export type NoneActivityState = {
  activityType: 'none';
  activityState: {};
};

export type ActivityState =
  | LearnActivityState
  | MeetupActivityState
  | NoneActivityState;

export type ActivityActions = LearnActivityActions | MeetupActivityActions;
