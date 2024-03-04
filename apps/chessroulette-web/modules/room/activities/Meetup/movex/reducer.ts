import { ActivityActions, ActivityState, initialActivityState } from '../../movex';
import { MeetupActivityActions } from './types';

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  return prev;
};
