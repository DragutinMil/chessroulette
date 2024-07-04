import { ChessColor, invoke, swapColor, toLongColor } from '@xmatter/util-kit';
import { ActivityState, initialActivityState } from '../../movex';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { MatchActivityActions, MatchState } from './types';
import { createGame } from 'apps/chessroulette-web/modules/Play/store';
import {
  GameTimeClass,
  Results,
} from 'apps/chessroulette-web/modules/Play/types';

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

    if (
      (prevPlay && prevPlay.game.status !== 'complete') ||
      (!prevPlay && prevMatch.completedPlays.length === 0)
    ) {
      return prev;
    }

    // reverse player colors after each match
    const players: MatchState['players'] = {
      white: { ...prevMatch.players.black },
      black: { ...prevMatch.players.white },
    };

    const newGameSettings = invoke(
      (): { timeClass: GameTimeClass; color: ChessColor } => {
        if (prevPlay) {
          return {
            color: swapColor(prevPlay.game.orientation),
            timeClass: prevPlay.game.timeClass,
          };
        }
        const lastGamePlayed = prevMatch.completedPlays.slice(-1)[0].game;
        return {
          color: swapColor(lastGamePlayed.orientation),
          timeClass: lastGamePlayed.timeClass,
        };
      }
    );

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        players,
        ongoingPlay: {
          game: createGame(newGameSettings),
        },
      },
    };
  }

  //TODO - test more here, not sure if the best
  if (!prevMatch.ongoingPlay) {
    return prev;
  }

  const nextCurrentPlay = prevMatch.ongoingPlay
    ? PlayStore.reducer(prevMatch.ongoingPlay, action as PlayStore.PlayActions)
    : prevMatch.ongoingPlay;

  if (nextCurrentPlay.game.status === 'aborted') {
    //First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke((): Pick<MatchState, 'winner' | 'status'> => {
      return prevMatch.completedPlays.length === 0
        ? {
            status: 'aborted',
            winner: undefined,
          }
        : {
            status: 'complete',
            winner:
              prevMatch.players[toLongColor(nextCurrentPlay.game.lastMoveBy)]
                .id,
          };
    });

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        completedPlays: [...prevMatch.completedPlays, nextCurrentPlay],
        ongoingPlay: undefined,
        ...nextMatchState,
      },
    };
  }

  if (nextCurrentPlay.game.status !== 'complete') {
    const nextStatus = invoke((): MatchState['status'] => {
      if (nextCurrentPlay.game.status === 'ongoing') {
        return 'ongoing';
      }
      return prevMatch.completedPlays.length > 0 ? 'ongoing' : 'pending';
    });

    return {
      ...prev,
      activityState: {
        ...prev.activityState,
        ongoingPlay: nextCurrentPlay,
        status: nextStatus,
        ...(nextStatus === 'aborted' && {
          winner:
            prevMatch.players[
              toLongColor(swapColor(nextCurrentPlay.game.lastMoveBy))
            ].id,
        }),
      },
    };
  }

  //Current Game is complete - so Match can only be ongoing or complete.

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

  const winner = invoke(() => {
    if (prevMatch.type !== 'bestOf') {
      return undefined;
    }

    return result.white === Math.ceil(prevMatch.rounds / 2)
      ? prevMatch.players.white.id
      : result.black === Math.ceil(prevMatch.rounds / 2)
      ? prevMatch.players.black.id
      : undefined;
  });

  const nextMatchStatus: MatchState['status'] = invoke(
    (): MatchState['status'] => {
      // TODO: Is this actually ok?
      // if (prevMatch.type === 'openEnded') {
      //   return prevMatch.status;
      // }

      if (winner) {
        return 'complete';
      }

      return 'ongoing';
    }
  );

  return {
    ...prev,
    activityState: {
      ...prev.activityState,
      completedPlays: [...prevMatch.completedPlays, nextCurrentPlay],
      ongoingPlay: undefined,
      status: nextMatchStatus,
      winner,
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

// TODO: This also can be memoized, soooo it could be an interesting feature
//  to avoid cron jobs and other time based logic?
// const $getDerivedState = (state: ActivityState): ActivityState => {
//   if (state.activityType === 'match') {
//     if (state.activityState?.ongoingPlay?.game.)
//   }

//   return state;
// }
