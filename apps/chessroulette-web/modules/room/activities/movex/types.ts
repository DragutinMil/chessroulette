import { PlayActions } from 'apps/chessroulette-web/modules/Play/store';
import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
// import { MatchActivityState } from '../Match/movex';
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
// | MatchActivityState;

export type ActivityActions =
  | LearnActivityActions
  | MeetupActivityActions
  | PlayActivityActions;
