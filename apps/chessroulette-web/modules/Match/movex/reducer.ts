import { MovexReducer } from 'movex-core-util';
import { ChessColor, invoke, swapColor, toLongColor } from '@xmatter/util-kit';
import { Old_Play_Results } from '@app/modules/Play';
import { MatchActions, MatchState } from './types';
import { initialMatchState } from './state';
import * as PlayStore from '@app/modules/Play/movex';
import { AbortedGame, GameTimeClass } from '@app/modules/Game';

// TODO: Instead of Hard coding this, put in the matchCreation setting as part of the MatchState
export const MATCH_TIME_TO_ABORT = 3 * 60 * 1000; // 3 mins

export const reducer: MovexReducer<MatchState, MatchActions> = (
  prev: MatchState = initialMatchState,
  action: MatchActions
): MatchState => {
  if (!prev) {
    return prev;
  }

  const prevMatch = prev;

  if (action.type === 'match:startNewGame') {
    if (prevMatch.status === 'complete') {
      return prev;
    }

    const prevPlay = prevMatch.ongoingPlay;

    if (
      (prevPlay && prevPlay.game.status !== 'complete') ||
      (!prevPlay && prevMatch.endedPlays.length === 0)
    ) {
      return prev;
    }

    // reverse player colors after each match
    const players: NonNullable<MatchState>['players'] = {
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
        const lastGamePlayed = prevMatch.endedPlays.slice(-1)[0].game;
        return {
          color: swapColor(lastGamePlayed.orientation),
          timeClass: lastGamePlayed.timeClass,
        };
      }
    );

    return {
      ...prev,
      players,
      ongoingPlay: {
        game: PlayStore.createPendingGame(newGameSettings),
      },
    };
  }

  //TODO - test more here, not sure if the best
  if (!prevMatch.ongoingPlay) {
    return prev;
  }

  const prevOngoingPlay = prevMatch.ongoingPlay;

  const nextCurrentPlay = PlayStore.reducer(
    prevOngoingPlay,
    action as PlayStore.PlayActions
  );

  if (nextCurrentPlay.game.status === 'aborted') {
    // TODO: See why this doesn't simply infer it as completed and I have to typecast it?
    const abortedCurrentPlay = nextCurrentPlay as PlayStore.AbortedPlayState;

    //First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke(
      (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
        return prevMatch.endedPlays.length === 0
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
      }
    );

    return {
      ...prev,
      endedPlays: [...prevMatch.endedPlays, abortedCurrentPlay],
      ongoingPlay: null,
      ...nextMatchState,
    };
  }

  if (nextCurrentPlay.game.status !== 'complete') {
    const nextStatus = invoke((): NonNullable<MatchState>['status'] => {
      if (nextCurrentPlay.game.status === 'ongoing') {
        return 'ongoing';
      }
      return prevMatch.endedPlays.length > 0 ? 'ongoing' : 'pending';
    });

    return {
      ...prev,
      ongoingPlay: nextCurrentPlay,
      status: nextStatus,
      ...(nextStatus === 'aborted' && {
        winner:
          prevMatch.players[
            toLongColor(swapColor(nextCurrentPlay.game.lastMoveBy))
          ].id,
      }),
    };
  }

  // Current Game is complete - so Match can only be ongoing or complete.

  const result: Old_Play_Results = {
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

  const nextMatchStatus = winner ? 'complete' : 'ongoing';

  return {
    ...prev,
    // TODO: See why this doesn't simply infer it as completed and I have to typecast it?
    endedPlays: [
      ...prevMatch.endedPlays,
      nextCurrentPlay as PlayStore.CompletedPlayState,
    ],
    ongoingPlay: null,
    status: nextMatchStatus,
    winner,
    players: {
      white: {
        ...prev.players.white,
        score: result.white,
      },
      black: {
        ...prev.players.black,
        score: result.black,
      },
    },
  };
};

reducer.$transformState = (state, masterContext): MatchState => {
  if (!state) {
    return state;
  }

  // Determine if Match is "aborted" onRead
  const match = state;

  if (match.status === 'complete' || match.status === 'aborted') {
    return state;
  }

  const ongoingPlay = match.ongoingPlay;

  // This reads the now() each time it runs
  if (ongoingPlay?.game.status === 'ongoing') {
    const turn = toLongColor(swapColor(ongoingPlay.game.lastMoveBy));

    const nextTimeLeft = PlayStore.calculateTimeLeftAt({
      at: masterContext.requestAt, // TODO: this can take in account the lag as well
      prevTimeLeft: ongoingPlay.game.timeLeft,
      turn,
    });

    return {
      ...match,
      ongoingPlay: {
        ...ongoingPlay,
        game: {
          ...ongoingPlay.game,
          timeLeft: nextTimeLeft,
        },
      },
    };
  }

  // if the ongoing game is idling & the abort time has passed
  if (
    ongoingPlay?.game.status === 'idling' &&
    masterContext.requestAt > ongoingPlay.game.startedAt + MATCH_TIME_TO_ABORT
  ) {
    const nextAbortedGame: AbortedGame = {
      ...ongoingPlay.game,
      status: 'aborted',
    };

    const nextAbortedPlay = { game: nextAbortedGame };

    // First game in the match is aborted by idling too long
    // and thus the whole Match gets aborted
    if (match.status === 'pending') {
      return {
        ...match,
        status: 'aborted',
        winner: null,
        endedPlays: [nextAbortedPlay],
        ongoingPlay: null,
      };
    }

    // A subsequent game in the match is aborted by idling too long
    // and thus the Match Gets completed with the winner the opposite player
    if (match.status === 'ongoing') {
      const nextWinner = match.players[ongoingPlay.game.lastMoveBy].id; // defaults to black

      return {
        ...match,
        status: 'complete',
        winner: nextWinner,
        endedPlays: [...match.endedPlays, nextAbortedPlay],
        ongoingPlay: null,
      };
    }
  }

  return state;
};
