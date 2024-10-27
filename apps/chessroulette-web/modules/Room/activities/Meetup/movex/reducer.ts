import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import * as MatchStore from '@app/modules/Match/movex';
import { MovexReducer } from 'movex-core-util';

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'meetup') {
    return prev;
  }

  return {
    ...prev,
    activityState: {
      ...prev.activityState,
      match: MatchStore.reducer(
        prev.activityState.match,
        action as MatchStore.MatchActions
      ),
    },
  };
};

// TODO: This is where the reducerMapping could really shine! taking care of the $transformState as well
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
