import { invoke, swapColor } from '@xmatter/util-kit';
import {
  ActivityActions,
  ActivityState,
  initialActivityState,
} from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { MatchState } from './types';
import { setupNewGame } from 'apps/chessroulette-web/modules/Play/store';

const matchReducer = (prev: any) => prev;

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => {
  if (prev.activityType !== 'match') {
    return prev;
  }

  const prevMatch = prev.activityState;

  if (action.type === 'match:startNewGame') {
    if (prevMatch.status === 'complete') {
      return prev;
    }

    const prevPlay = prevMatch.currentPlay;

    if (prevPlay.game.status !== 'complete') {
      return prev;
    }

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        plays: [...prevMatch.plays, prevPlay],
        currentPlay: {
          game: setupNewGame(
            prevPlay.game.timeClass,
            swapColor(prevPlay.game.orientation) // TODO: This should be done differently once we have colors with players
          ),
        },
      },
    };
  }

  const nextCurrentPlay = prev.activityState.currentPlay
    ? PlayStore.reducer(
        prev.activityState.currentPlay,
        action as PlayStore.PlayActions
      )
    : prev.activityState.currentPlay;

  const nextMatchStatus: MatchState['status'] = invoke(
    (): MatchState['status'] => {
      // If there is a current ongoing game the status of the match is also ongong
      if (nextCurrentPlay.game.status === 'ongoing') {
        return 'ongoing';
      }

      // If it's a Friendly Match it never goes into completion
      if (prevMatch.type === 'friendly') {
        // TODO: Is this actually ok?
        return prevMatch.status;
      }

      if (prevMatch.type === 'bestOf') {
        if (prevMatch.plays.length === prevMatch.rounds) {
          return 'complete';
        }

        // TODO: Fill up more stuff
      }

      return 'pending';
    }
  );

  return {
    ...prev,
    activityState: {
      ...prev.activityState,
      // plays: nextPlays,
      currentPlay: nextCurrentPlay,
      status: nextMatchStatus,
    },
  };
};
