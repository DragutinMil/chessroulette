import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import * as MatchStore from '@app/modules/Match/movex';
import * as MeetupStore from '@app/modules/Meetup/movex';
import { MovexReducer } from 'movex-core-util';

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'meetup') {
    return prev;
  }
console.log('meetup', action);
  return {
    ...prev,
    activityState: MeetupStore.reducer(
      prev.activityState,
      action as MeetupStore.MeetupActions
    ),
  };
};

if (MatchStore.reducer.$transformState) {
  const matchStateTransformer = MatchStore.reducer.$transformState;
  reducer.$transformState = (state, masterContext): ActivityState => {
    if (state.activityType === 'meetup') {
      return {
        ...state,
        activityState: {
          ...state.activityState,
          match: matchStateTransformer(
            state.activityState.match,
            masterContext
          ),
        },
      };
    }

    return state;
  };
}
