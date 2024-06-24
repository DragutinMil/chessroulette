import React, { PropsWithChildren, useMemo } from 'react';
import { MatchStateContext, MatchStateContextType } from './MatchStateContext';
import { MatchState } from '../../room/activities/Match/movex';

type Props = PropsWithChildren &
  Pick<MatchState, 'type' | 'rounds' | 'status' | 'completedPlays'>;

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
      results: props.completedPlays.reduce(
        (prev, nextPlay) => ({
          white: nextPlay.game.winner === 'white' ? prev.white + 1 : prev.white,
          black: nextPlay.game.winner === 'black' ? prev.black + 1 : prev.black,
        }),
        { white: 0, black: 0 }
      ),
    }),
    [props]
  );

  return (
    <MatchStateContext.Provider value={value}>
      {props.children}
    </MatchStateContext.Provider>
  );
};
