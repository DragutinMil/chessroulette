import type { LearnActivityState, LearnActivityActions } from '../Learn/movex';
import { AichessActivityState, AichessActivityActions } from '../Aichess/movex';
import { LearnAiActivityState, LearnAiActivityActions } from '../LearnAi/movex';
import { PuzzleActivityState, PuzzleActivityActions } from '../Puzzle/movex';
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
  | AichessActivityState
  | LearnAiActivityState
  | PuzzleActivityState;

export type ActivityActions =
  | LearnActivityActions
  | MeetupActivityActions
  | MatchActivityActions
  | AichessActivityActions
  | LearnAiActivityActions
  | PuzzleActivityActions;
