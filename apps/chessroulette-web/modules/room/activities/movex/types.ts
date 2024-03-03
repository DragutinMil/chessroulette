import type * as LearnActivity from '../Learn/movex';

export type ActivityState =
  | LearnActivity.LearnActivityState
  | LearnActivity.OtherActivities;

export type ActivityActions = LearnActivity.LearnActivityActions; // add more
