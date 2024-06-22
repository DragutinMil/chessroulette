import { invoke, swapColor } from '@xmatter/util-kit';
import { ActivityState, initialActivityState } from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { MatchActivityActions, MatchState } from './types';
import { createGame } from 'apps/chessroulette-web/modules/Play/store';

const matchReducer = (prev: any) => prev;

export const reducer = (
  prev: ActivityState = initialActivityState,
  action: MatchActivityActions
): ActivityState => {
  if (prev.activityType !== 'match') {
    return prev;
  }

  if (!prev.activityState) {
    return prev;
  }

  const prevMatch = prev.activityState;

  if (action.type === 'match:startNewGame') {
    if (prevMatch.status === 'complete') {
      return prev;
    }

    const prevPlay = prevMatch.ongoingPlay;

    if (prevPlay.game.status !== 'complete') {
      return prev;
    }

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        completedPlays: [...prevMatch.completedPlays, prevPlay],
        ongoingPlay: {
          game: createGame({
            timeClass: prevPlay.game.timeClass,
            color: swapColor(prevPlay.game.orientation), // TODO: This should be done differently once we have colors with players
          }),
        },
      },
    };
  }

  const nextCurrentPlay = prev.activityState.ongoingPlay
    ? PlayStore.reducer(
        prev.activityState.ongoingPlay,
        action as PlayStore.PlayActions
      )
    : prev.activityState.ongoingPlay;

  const nextMatchStatus: MatchState['status'] = invoke(
    (): MatchState['status'] => {
      // If there is a current ongoing game the status of the match is also ongong
      if (nextCurrentPlay.game.status === 'ongoing') {
        return 'ongoing';
      }

      // If it's a Friendly Match it never goes into completion
      if (prevMatch.type === 'openEnded') {
        // TODO: Is this actually ok?
        return prevMatch.status;
      }

      if (prevMatch.type === 'bestOf') {
        // Take out the draw games as they don't count towards the Best-Of score.
        if (
          prevMatch.completedPlays.reduce((accum, play) => {
            if (play.game.winner === '1/2') {
              return accum;
            }
            return accum + 1;
          }, 0) === prevMatch.rounds
        ) {
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
      ongoingPlay: nextCurrentPlay,
      status: nextMatchStatus,
    },
  };
};
