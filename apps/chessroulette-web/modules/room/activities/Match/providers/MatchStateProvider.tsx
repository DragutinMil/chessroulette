import React, { PropsWithChildren, useMemo } from 'react';
import { MatchStateContext, MatchStateContextType } from './MatchStateContext';
import { MatchState } from '../movex';

type Props = PropsWithChildren<MatchState>;

export const MatchStateProvider: React.FC<Props> = (props) => {
  const value = useMemo<MatchStateContextType>(
    () => ({
      type: props.type,
      status: props.status,
      rounds: props.rounds,
      draws: props.completedPlays.filter((play) => play.game.winner === '1/2')
        .length,
      completedPlaysCount: props.completedPlays.length,
      currentRound:
        props.completedPlays.filter((play) => play.game.winner !== '1/2')
          .length + 1,
      ongoingPlay: props.ongoingPlay,
      lastCompletedPlay: props.completedPlays.slice(-1)[0],
      results: {
        white: props.players.white.score,
        black: props.players.black.score,
      },
      winner: props.winner,
      players: props.players,
    }),
    [props]
  );

  return (
    <MatchStateContext.Provider value={value}>
      {props.children}
    </MatchStateContext.Provider>
  );
};
