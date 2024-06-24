import React, { PropsWithChildren, useMemo } from 'react';
import { MatchStateContext, MatchStateContextType } from './MatchStateContext';
import { MatchState } from '../../room/activities/Match/movex';

type Props = PropsWithChildren & Omit<MatchState, 'ongoingPlay'>;

export const MatchStateProvider: React.FC<Props> = (props) => {
  const value = useMemo<MatchStateContextType>(
    () => ({
      type: props.type,
      status: props.status,
      rounds: props.rounds,
      // excludes draw results
      completedPlays: props.completedPlays.length,
      currentRound:
        props.completedPlays.filter((play) => play.game.winner !== '1/2')
          .length + 1,
      results: {
        white: props.players.white.score,
        black: props.players.black.score,
      },
    }),
    [props]
  );

  return (
    <MatchStateContext.Provider value={value}>
      {props.children}
    </MatchStateContext.Provider>
  );
};
