import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
import { LearnAiActivityState, LearnAiActivityActions } from '../LearnAi/movex';
import { PuzzleActivityState, PuzzleActivityActions } from '../Puzzle/movex';
import { ReviewActivityState, ReviewActivityActions } from '../Review/movex';
import type {
  MeetupActivityState,
  MeetupActivityActions,
} from '../Meetup/movex';
import { MatchActivityActions, MatchActivityState } from '../Match/movex';

export type NoneActivityState = {
  activityType: 'none';
  activityState: {};
};

export type ActivityState =
  | LearnActivityState
  | MeetupActivityState
  | NoneActivityState
  | MatchActivityState
  | LearnAiActivityState
  | ReviewActivityState
  | PuzzleActivityState;

export type ActivityActions =
  | LearnActivityActions
  | MeetupActivityActions
  | MatchActivityActions
  | ReviewActivityActions
  | LearnAiActivityActions
  | PuzzleActivityActions;
