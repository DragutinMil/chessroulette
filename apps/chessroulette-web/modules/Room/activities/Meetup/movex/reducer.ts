import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import * as MatchStore from '@app/modules/Match/movex';
import {
  getNewChessGame,
  localChessMoveToChessLibraryMove,
  swapColor,
} from '@xmatter/util-kit';
import { initialMeetupActivityState } from './state';
import { MovexReducer } from 'movex-core-util';

export const reducer: MovexReducer<ActivityState, ActivityActions> = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'meetup') {
    return prev;
  }

  // const prevActivityState = prev.activityState;

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

  // if (action.type === 'meetup:move') {
  //   const instance = getNewChessGame(prevActivityState.game);

  //   try {
  //     instance.move(localChessMoveToChessLibraryMove(action.payload));
  //   } catch (e) {
  //     console.error(
  //       'Action Error:',
  //       action.type,
  //       'Move Invalid:',
  //       action.payload,
  //       prev,
  //       e
  //     );
  //     return prev;
  //   }

  //   return {
  //     ...prev,
  //     activityState: {
  //       ...prev.activityState,
  //       game: {
  //         ...prev.activityState.game,
  //         pgn: instance.pgn(),
  //       },
  //     },
  //   };
  // }

  // if (action.type === 'meetup:startNewGame') {
  //   return {
  //     ...prev,
  //     activityState: {
  //       ...prev.activityState,
  //       game: {
  //         ...initialMeetupActivityState.activityState.game,
  //         orientation: swapColor(prev.activityState.game.orientation),
  //       },
  //     },
  //   };
  // }

  // return prev;
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
          )
        },
      };
    }

    return state;
  };
}
