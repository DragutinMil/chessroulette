import { MovexReducer } from 'movex-core-util';
import { ChessColor, invoke, swapColor, toLongColor } from '@xmatter/util-kit';
import { ActivityState } from '../../movex';
import {
  PlayStore,
  GameTimeClass,
  Results,
} from 'apps/chessroulette-web/modules/Play';
import { MatchActivityActions, MatchState } from './types';
import { initialMatchActivityState } from './state';
import { calculateTimeLeftAt } from 'apps/chessroulette-web/modules/Play/store/util';
import { MovexContext } from 'movex-react/lib/MovexContext';
// import { calculateGameTimeLeftAt } from 'apps/chessroulette-web/modules/Play/lib';

// const matchReducer = (prev: any) => prev;

// TODO: Instead of Hard coding this, put in the matchCreation setting as part of the MatchState
export const MATCH_TIME_TO_ABORT = 3 * 60 * 1000; // 3 mins
// export const MATCH_TIME_TO_ABORT = 20 * 1000; // 3 mins

export const reducer: MovexReducer<ActivityState, MatchActivityActions> = (
  prev: ActivityState = initialMatchActivityState,
  action: MatchActivityActions
): ActivityState => {
  if (prev.activityType !== 'match') {
    return prev;
  }

  if (!prev.activityState) {
    return prev;
  }

  // console.log('match reducer', { action });

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
          game: PlayStore.createPendingGame(newGameSettings),
        },
      },
    };
  }

  //TODO - test more here, not sure if the best
  if (!prevMatch.ongoingPlay) {
    return prev;
  }

  const prevOngoingPlay = prevMatch.ongoingPlay;

  // const nextCurrentPlay = invoke(() => {
  //   const n = PlayStore.reducer(
  //     prevOngoingPlay,
  //     action as PlayStore.PlayActions
  //   );

  //   return {
  //     ...n,
  //     game: {
  //       ...n.game,

  //       // Don't over substract the times
  //       // timeLeft: prevOngoingPlay.game.timeLeft,
  //     },
  //   };
  // });
  const nextCurrentPlay = PlayStore.reducer(
    prevOngoingPlay,
    action as PlayStore.PlayActions
  );

  if (nextCurrentPlay.game.status === 'aborted') {
    //First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke((): Pick<MatchState, 'winner' | 'status'> => {
      return prevMatch.completedPlays.length === 0
        ? {
            status: 'aborted',
            winner: null,
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
        ongoingPlay: null,
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

  // Current Game is complete - so Match can only be ongoing or complete.

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
      return null;
    }

    return result.white === Math.ceil(prevMatch.rounds / 2)
      ? prevMatch.players.white.id
      : result.black === Math.ceil(prevMatch.rounds / 2)
      ? prevMatch.players.black.id
      : null;
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
      ongoingPlay: null,
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

reducer.$transformState = (state, masterContext) => {
  // const isLocalClient = (masterContext as any)._local === true;

  // console.log(
  //   'Match $transformState called',
  //   `Local? ${isLocalClient}`,
  //   JSON.stringify({ masterContext }, null, 2)
  // );

  if (!(state.activityType === 'match' && state.activityState)) {
    return state;
  }

  // Determine if Match is "aborted" onRead
  const match = state.activityState;

  if (match.status === 'complete' || match.status === 'aborted') {
    return state;
  }

  const ongoingPlay = match.ongoingPlay;

  // This reads the now() each time it runs
  if (ongoingPlay?.game.status === 'ongoing') {
    // const ongoingGame = ongoingPlay;
    // console.log(
    //   'Match $transformState going to substract the times',
    // );

    const turn = toLongColor(swapColor(ongoingPlay.game.lastMoveBy));

    // console.group('-- match calculate');
    const nextTimeLeft = calculateTimeLeftAt({
      at: masterContext.requestAt, // TODO: this can take in account the lag as well
      // lastMoveAt: ongoingPlay.game.timeLeft.lastUpdatedAt,
      prevTimeLeft: ongoingPlay.game.timeLeft,
      turn,
    });
    // console.log('-- end match calculate');
    // console.groupEnd();

    // if (nextTimeLeft[turn] <= 0) {

    //   const nextWinner = match.players[ongoingPlay.game.lastMoveBy].id; // defaults to black

    //   const nextOngoingPlay

    //   return {
    //     ...state,
    //     activityState: {
    //       ...match,
    //       status: 'complete',
    //       winner: nextWinner,
    //       completedPlays: [...match.completedPlays, nextAbortedPlay],
    //       ongoingPlay: undefined,
    //     },
    //   };
    // }

    // prevTimeLefts.push({ ...nextTimeLeft, turn });
    // console.group('time lefts');
    // console.log(JSON.stringify(prevTimeLefts));
    // console.groupEnd();

    try {
      if (!!window) {
        (window as any)._prevTimeLefts = [
          ...((window as any)?._prevTimeLefts || []),
          { ...nextTimeLeft, turn },
        ];
        console.log(
          `[$stateTransfomer] _prevTimeLefts`,
          JSON.stringify((global as any)._prevTimeLefts, null, 2)
        );
        console.log(
          `[$stateTransfomer]`,
          JSON.stringify({ masterContext }, null, 2)
        );
      }
    } catch (e) {
      try {
        if (!!global) {
          (global as any)._prevTimeLefts = [
            ...((global as any)?._prevTimeLefts || []),
            { ...nextTimeLeft, turn },
          ];
          console.log(
            `[$stateTransfomer] _prevTimeLefts`,
            JSON.stringify((global as any)._prevTimeLefts, null, 2)
          );
          console.log(
            `[$stateTransfomer]`,
            JSON.stringify({ masterContext }, null, 2)
          );
        }
      } catch (e) {
        console.error('eee', e);
      }
    }

    return {
      ...state,
      activityState: {
        ...match,
        ongoingPlay: {
          ...ongoingPlay,
          game: {
            ...ongoingPlay.game,
            timeLeft: nextTimeLeft,
          },
        },
      },
    };
  }

  // if the ongoing game is idling & the abort time has passed
  if (
    ongoingPlay?.game.status === 'idling' &&
    masterContext.requestAt > ongoingPlay.game.startedAt + MATCH_TIME_TO_ABORT
  ) {
    const nextAbortedGame: PlayStore.AbortedGame = {
      ...ongoingPlay.game,
      status: 'aborted',
    };

    const nextAbortedPlay = { game: nextAbortedGame };

    // First game in the match is aborted by idling too long
    // and thus the whole Match gets aborted
    if (match.status === 'pending') {
      return {
        ...state,
        activityState: {
          ...match,
          status: 'aborted',
          winner: null,
          completedPlays: [nextAbortedPlay],
          ongoingPlay: null,
        },
      };
    }

    // A subsequent game in the match is aborted by idling too long
    // and thus the Match Gets completed with the winner the opposite player
    if (match.status === 'ongoing') {
      const nextWinner = match.players[ongoingPlay.game.lastMoveBy].id; // defaults to black

      return {
        ...state,
        activityState: {
          ...match,
          status: 'complete',
          winner: nextWinner,
          completedPlays: [...match.completedPlays, nextAbortedPlay],
          ongoingPlay: null,
        },
      };
    }
  }

  return state;
};

// TODO: This also can be memoized, soooo it could be an interesting feature
//  to avoid cron jobs and other time based logic?
// const $getDerivedState = (state: ActivityState): ActivityState => {
//   if (state.activityType === 'match') {
//     if (state.activityState?.ongoingPlay?.game.)
//   }

//   return state;
// }
