import { MovexReducer } from 'movex-core-util';
import { ActivityActions, type ActivityState } from '../../movex';
import { initialMatchActivityState } from './state';
import * as MatchStore from '@app/modules/Match/movex';
import counterReducer, {
  CounterActions,
} from '../counter';
export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialMatchActivityState,
  action: ActivityActions 
): ActivityState => {
  console.log('prev room ativityState', prev)
  if (prev.activityType === 'match') {
    const isCounterAction =
      action.type === 'increment' ||
      action.type === 'decrement' ||
      action.type === 'change' ||
      action.type === 'incrementBy';
      console.log('paprika')
if (isCounterAction) {
   console.log('paprika')
      return {
        ...prev,
        increment: counterReducer(
          { count: prev.increment },
          action as CounterActions
        ).count,
      };
}


    return {
      ...prev,
      activityState: MatchStore.reducer(
        prev.activityState,
        action as MatchStore.MatchActions
      ),
    };
  }
  return prev;
};

if (MatchStore.reducer.$transformState) {
  const matchStateTransformer = MatchStore.reducer.$transformState;

  reducer.$transformState = (state, masterContext): ActivityState => {
    
    if (state.activityType === 'match') {
      return {
        ...state,
        activityState: matchStateTransformer(
          state.activityState,
          masterContext
        ),
      };
    }

    return state;
  };
}
