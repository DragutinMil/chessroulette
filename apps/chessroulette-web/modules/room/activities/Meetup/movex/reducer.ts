import { ActivityActions, ActivityState, initialActivtityState } from '../../movex';
import { MeetupActivityActions } from './types';

export const reducer = (
  prev: ActivityState = initialActivtityState,
  action: ActivityActions
): ActivityState => {
  return prev;
};
