import React, { PropsWithChildren, useMemo } from 'react';
import { GameProvider } from '@app/modules/Game/GameProvider';
import { PENDING_UNTIMED_GAME } from '@app/modules/Game';
import { MatchStateContext, MatchStateContextType } from './MatchStateContext';
import type { MatchState } from '../movex';
import { User } from '@app/modules/User';

type Props = PropsWithChildren<{
  match: NonNullable<MatchState>;
  userId: User['id'];
}>;

export const MatchProvider: React.FC<Props> = ({ match, userId, children }) => {
  const contextState = useMemo<MatchStateContextType>(
    () => ({
      ...match,
      drawsCount: match.endedGames.filter((game) => game.winner === '1/2')
        .length,
      endedGamesCount: match.endedGames.length,
      currentRound:
        match.endedGames.filter((game) => game.winner !== '1/2').length + 1,
      lastEndedGame: match.endedGames.slice(-1)[0],
      results: {
        white: match.players.white.points,
        black: match.players.black.points,
      },
    }),
    [match]
  );

  // const game = useMemo(
  //   () =>
  //     match.ongoingGame ||
  //     matchState.endedGames.slice(-1)[0] ||
  //     // Default to Initial Play State if no ongoing or completed
  //     PlayStore.initialPlayState,
  //   [ongoingPlay, matchState.endedGames]
  // );

  return (
    <GameProvider
      game={
        contextState?.gameInPlay ||
        contextState?.lastEndedGame ||
        PENDING_UNTIMED_GAME
      }
      playerId={userId}
    >
      <MatchStateContext.Provider value={contextState}>
        {children}
      </MatchStateContext.Provider>
    </GameProvider>
  );
};
