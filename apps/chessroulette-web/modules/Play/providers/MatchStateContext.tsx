import { createContext } from 'react';
import { MatchState } from '../../room/activities/Match/movex';

export type MatchStateContextType = Pick<
  MatchState,
  'type' | 'rounds' | 'status'
> & {
  completedPlays: number;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  completedPlays: 0,
});
