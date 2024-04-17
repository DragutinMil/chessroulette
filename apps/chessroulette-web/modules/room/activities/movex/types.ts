import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
import type {
  MeetupActivityState,
  MeetupActivityActions,
} from '../Meetup/movex';
import { PlayActivityActions, PlayActivityState } from '../Play/movex';

export type NoneActivityState = {
  activityType: 'none';
  activityState: {};
};

export type ActivityState =
  | LearnActivityState
  | MeetupActivityState
  | NoneActivityState
  | PlayActivityState;

export type ActivityActions =
  | LearnActivityActions
  | MeetupActivityActions
  | PlayActivityActions;
