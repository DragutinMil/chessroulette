import { composeReducers } from '@xmatter/util-kit';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';

const matchReducer = (prev: any) => prev;

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'match') {
    return prev;
  }

  const nextCurrentPlay = prev.activityState.currentPlay
    ? PlayStore.reducer(
        prev.activityState.currentPlay,
        action as PlayStore.PlayActions
      )
    : prev.activityState.currentPlay;

  return {
    ...prev,
    activityState: {
      ...prev.activityState,
      currentPlay: nextCurrentPlay,
    },
  };
};
