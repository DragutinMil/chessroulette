import React, { PropsWithChildren, useMemo } from 'react';
import { MatchStateContext, MatchStateContextType } from './MatchStateContext';
import type { MatchState } from '../movex';

type Props = PropsWithChildren<{ match: NonNullable<MatchState> }>;

export const MatchStateProvider: React.FC<Props> = ({ match, children }) => {
  const value = useMemo<MatchStateContextType>(
    () => ({
      ...match,
      draws: match.endedPlays.filter((game) => game.winner === '1/2').length,
      endedPlaysCount: match.endedPlays.length,
      currentRound:
        match.endedPlays.filter((game) => game.winner !== '1/2').length + 1,
      lastEndedPlay: match.endedPlays.slice(-1)[0],
      results: {
        white: match.players.white.points,
        black: match.players.black.points,
      },
    }),
    [match]
  );

  return (
    <MatchStateContext.Provider value={value}>
      {children}
    </MatchStateContext.Provider>
  );
};
