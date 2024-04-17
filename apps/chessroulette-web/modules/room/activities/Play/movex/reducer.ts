import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { getNewChessGame, swapColor } from '@xmatter/util-kit';
import { initialPlayActivityState } from './state';

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'play') {
    return prev;
  }

  const prevActivityState = prev.activityState;

  if (action.type === 'play:move') {
    const instance = getNewChessGame({ pgn: prevActivityState.game.pgn });

    try {
      instance.move(action.payload);
    } catch (e) {
      console.error(
        'Action Error:',
        action.type,
        'Move Invalid:',
        action.payload,
        prev,
        e
      );
      return prev;
    }

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...prev.activityState.game,
          pgn: instance.pgn(),
        },
      },
    };
  }

  if (action.type === 'play:startNewGame') {
    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        game: {
          ...initialPlayActivityState.activityState.game,
          orientation: swapColor(prev.activityState.game.orientation),
        },
      },
    };
  }

  return prev;
};
