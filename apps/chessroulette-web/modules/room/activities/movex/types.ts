import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
import type {
  MeetupActivityState,
  MeetupActivityActions,
} from '../Meetup/movex';

// Remove this as the other activities are going to be implemented
export type UNIMPLEMENTED_Activities = {
  activityType: 'play' | 'none';
  activityState: {};
};

export type ActivityState = LearnActivityState | MeetupActivityState | UNIMPLEMENTED_Activities;

export type ActivityActions = LearnActivityActions | MeetupActivityActions;
