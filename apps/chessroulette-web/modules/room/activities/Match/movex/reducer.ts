import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType === 'match') {
    return {
      ...prev,
      activityState: PlayStore.reducer(
        prev.activityState,
        action as PlayStore.PlayActions
      ),
    };
  }

  return prev;
};
