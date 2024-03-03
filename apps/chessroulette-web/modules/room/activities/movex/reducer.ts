// The composition of all activity reducers

import * as LearnActivity from '../Learn/movex';
import { initialActivtityState } from './state';
import { ActivityActions, ActivityState } from './types';

export const roomActivityReducer = (
  state: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  return LearnActivity.reducer(state, action);

  // return prev;
};
