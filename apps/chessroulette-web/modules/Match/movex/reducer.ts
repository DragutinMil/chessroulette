import { MovexReducer } from 'movex-core-util';
import { invoke, swapColor, toLongColor } from '@xmatter/util-kit';
// import { Old_Play_Results } from '@app/modules/Match/Play';
import { MatchActions, MatchState } from './types';
import { initialMatchState } from './state';
import * as PlayStore from '@app/modules/Match/Play/store';
import { AbortedGame } from '@app/modules/Game';
import { MatchResults } from '../types';
import { getMatchPlayerRoleById } from './util';

// TODO: Instead of Hard coding this, put in the matchCreation setting as part of the MatchState
// export const MATCH_TIME_TO_ABORT = 3 * 60 * 1000; // 3 mins

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

    const prevPlay = prevMatch.gameInPlay;

    if (
      // (prevPlay && prevPlay.status !== 'complete') ||
      !prevPlay &&
      prevMatch.endedGames.length === 0
    ) {
      return prev;
    }

    // reverse player colors after each match
    const players: NonNullable<MatchState>['players'] = {
      white: { ...prevMatch.players.black },
      black: { ...prevMatch.players.white },
    };

    const newGameParams = invoke((): PlayStore.CreatePendingGameParams => {
      const prevGame = prevPlay || prevMatch.endedGames.slice(-1)[0];

      return {
        // challengerColor: swapColor(prevPlay.orientation),
        timeClass: prevGame.timeClass,
        players: {
          white: prevGame.players.black,
          black: prevGame.players.white,
        },
      };
    });

    return {
      ...prev,
      players,
      gameInPlay: PlayStore.createPendingGame(newGameParams),
    };
  }

  //TODO - test more here, not sure if the best
  if (!prevMatch.gameInPlay) {
    return prev;
  }

  const prevOngoingGame = prevMatch.gameInPlay;
  const nextOngoingGame = PlayStore.reducer(prevOngoingGame, action);

  if (nextOngoingGame.status === 'aborted') {
    const abortedCurrentPlay = nextOngoingGame;

    // First game abort results in aborted match. Afterwards results in completed match + winner
    const nextMatchState = invoke(
      (): Pick<NonNullable<MatchState>, 'winner' | 'status'> => {
        return prevMatch.endedGames.length === 0
          ? {
              status: 'aborted',
              winner: null,
            }
          : {
              status: 'complete',
              winner: getMatchPlayerRoleById(
                prevMatch,
                nextOngoingGame.players[nextOngoingGame.lastMoveBy]
              ),
            };
      }
    );

    return {
      ...prev,
      endedGames: [...prevMatch.endedGames, abortedCurrentPlay],
      gameInPlay: null,
      ...nextMatchState,
    };
  }

  if (nextOngoingGame.status !== 'complete') {
    const nextOngoingGameStatus = invoke(
      (): NonNullable<MatchState>['status'] => {
        if (nextOngoingGame.status === 'ongoing') {
          return 'ongoing';
        }
        return prevMatch.endedGames.length > 0 ? 'ongoing' : 'pending';
      }
    );

    return {
      ...prev,
      gameInPlay: nextOngoingGame,
      status: nextOngoingGameStatus,
      ...(nextOngoingGameStatus === 'aborted' && {
        winner: getMatchPlayerRoleById(
          prevMatch,
          nextOngoingGame.players[swapColor(nextOngoingGame.lastMoveBy)]
        ),
        // winner:
        //   prevMatch.players[toLongColor(swapColor(nextOngoingGame.lastMoveBy))]
        //     .id,
      }),
    };
  }

  // Current Game is complete - so Match can only be ongoing or complete.

  // const result: Old_Play_Results = {
  //   white:
  //     nextOngoingGame.winner === 'white'
  //       ? prevMatch.players.white.points + 1
  //       : prevMatch.players.white.points,
  //   black:
  //     nextOngoingGame.winner === 'black'
  //       ? prevMatch.players.black.points + 1
  //       : prevMatch.players.black.points,
  // };

  const prevPlayersByRole = {
    challengee: prev.challengee,
    challenger: prev.challenger,
  };

  const nextPlayersByRole: Pick<
    NonNullable<MatchState>,
    'challengee' | 'challenger'
  > = invoke(() => {
    if (nextOngoingGame.winner === '1/2') {
      return prevPlayersByRole;
    }

    const winnerByRole = getMatchPlayerRoleById(
      prev,
      nextOngoingGame.players[nextOngoingGame.winner]
    );

    if (!winnerByRole) {
      return prevPlayersByRole;
    }

    return {
      ...prevPlayersByRole,
      [winnerByRole]: {
        ...prevPlayersByRole[winnerByRole],
        points: prevPlayersByRole[winnerByRole].points + 1,
      },
    };
  });

  const winner: NonNullable<MatchState>['winner'] = invoke(() => {
    if (prevMatch.type === 'bestOf') {
      const maxRounds = Math.ceil(prevMatch.rounds / 2);

      if (nextPlayersByRole.challenger.points === maxRounds) {
        return 'challenger';
      }

      if (nextPlayersByRole.challengee.points === maxRounds) {
        return 'challengee';
      }

      return null;
    }

    // TBD how a winner is calculated for the rest of match types
    return null;
  });

  const nextMatchStatus = winner ? 'complete' : 'ongoing';

  return {
    ...prev,
    endedGames: [...prevMatch.endedGames, nextOngoingGame],
    gameInPlay: null,
    status: nextMatchStatus,
    winner,
    ...nextPlayersByRole,
    players: {
      white: {
        ...prev.players.white,
        // points: result.white,
      },
      black: {
        ...prev.players.black,
        // points: result.black,
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

  const ongoingPlay = match.gameInPlay;

  // This reads the now() each time it runs
  if (ongoingPlay?.status === 'ongoing') {
    const turn = toLongColor(swapColor(ongoingPlay.lastMoveBy));

    const nextTimeLeft = PlayStore.calculateTimeLeftAt({
      at: masterContext.requestAt, // TODO: this can take in account the lag as well
      prevTimeLeft: ongoingPlay.timeLeft,
      turn,
    });

    return {
      ...match,
      gameInPlay: {
        ...ongoingPlay,
        timeLeft: nextTimeLeft,
      },
    };
  }

  // if the ongoing game is idling & the abort time has passed
  if (
    ongoingPlay?.status === 'idling' &&
    masterContext.requestAt > ongoingPlay.startedAt + state.timeToAbortMs
  ) {
    const nextAbortedGame: AbortedGame = {
      ...ongoingPlay,
      status: 'aborted',
    };

    // const nextAbortedPlay = nextAbortedGame;

    // First game in the match is aborted by idling too long
    // and thus the whole Match gets aborted
    if (match.status === 'pending') {
      return {
        ...match,
        status: 'aborted',
        winner: null,
        endedGames: [nextAbortedGame],
        gameInPlay: null,
      };
    }

    // A subsequent game in the match is aborted by idling too long
    // and thus the Match Gets completed with the winner the opposite player
    if (match.status === 'ongoing') {
      return {
        ...match,
        status: 'complete',
        winner: getMatchPlayerRoleById(
          match,
          ongoingPlay.players[ongoingPlay.lastMoveBy]
        ),
        endedGames: [...match.endedGames, nextAbortedGame],
        gameInPlay: null,
      };
    }
  }

  return state;
};
