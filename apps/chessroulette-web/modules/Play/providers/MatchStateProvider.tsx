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
      completedPlays: props.completedPlays.length,
    }),
    [props]
  );

  return (
    <MatchStateContext.Provider value={value}>
      {props.children}
    </MatchStateContext.Provider>
  );
};
