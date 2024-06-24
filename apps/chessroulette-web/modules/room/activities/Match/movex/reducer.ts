import { invoke, swapColor } from '@xmatter/util-kit';
import { ActivityState, initialActivityState } from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { MatchActivityActions, MatchState } from './types';
import { createGame } from 'apps/chessroulette-web/modules/Play/store';
import { Results } from 'apps/chessroulette-web/modules/Play/types';

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

    // reverse player colors after each match
    const players: MatchState['players'] = {
      white: { id: prevMatch.players.black.id },
      black: { id: prevMatch.players.white.id },
    };

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        players,
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
        const prevResults = prevMatch.completedPlays.reduce(
          (prev, nextPlay) => ({
            white:
              nextPlay.game.winner === 'white' ? prev.white + 1 : prev.white,
            black:
              nextPlay.game.winner === 'black' ? prev.black + 1 : prev.black,
          }),
          { white: 0, black: 0 }
        );

        const result: Results = {
          white:
            nextCurrentPlay.game.winner === 'white'
              ? prevResults.white + 1
              : prevResults.white,
          black:
            nextCurrentPlay.game.winner === 'black'
              ? prevResults.black + 1
              : prevResults.black,
        };
        if (
          result.white === Math.ceil(prevMatch.rounds / 2) ||
          result.black === Math.ceil(prevMatch.rounds / 2)
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
