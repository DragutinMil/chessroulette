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
      white: { ...prevMatch.players.black },
      black: { ...prevMatch.players.white },
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

  const result: Results = {
    white:
      nextCurrentPlay.game.winner === 'white'
        ? prevMatch.players.white.score + 1
        : prevMatch.players.white.score,
    black:
      nextCurrentPlay.game.winner === 'black'
        ? prevMatch.players.black.score + 1
        : prevMatch.players.black.score,
  };

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
        // const prevResults = prevMatch.completedPlays.reduce(
        //   (prev, nextPlay) => ({
        //     white:
        //       nextPlay.game.winner === 'white' ? prev.white + 1 : prev.white,
        //     black:
        //       nextPlay.game.winner === 'black' ? prev.black + 1 : prev.black,
        //   }),
        //   { white: 0, black: 0 }
        // );

        if (
          result.white === Math.ceil(prevMatch.rounds / 2) ||
          result.black === Math.ceil(prevMatch.rounds / 2)
        ) {
          return 'complete';
        }

        if (
          nextCurrentPlay.game.status !== 'pending' ||
          prevMatch.completedPlays.length > 0
        ) {
          return 'ongoing';
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
      players: {
        white: {
          ...prev.activityState.players.white,
          score: result.white,
        },
        black: {
          ...prev.activityState.players.black,
          score: result.black,
        },
      },
    },
  };
};
