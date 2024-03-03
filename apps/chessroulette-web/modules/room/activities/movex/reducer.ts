// The composition of all activity reducers

import * as LearnActivity from '../Learn/movex';
import { initialActivtityState } from './state';
import { ActivityActions, ActivityState } from './types';
import * as MeetupActivity from '../Meetup/movex';

export const roomActivityReducer = (
  state: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  // Return Use a composer function
  return MeetupActivity.reducer(LearnActivity.reducer(state, action), action);

  // return prev;
};
