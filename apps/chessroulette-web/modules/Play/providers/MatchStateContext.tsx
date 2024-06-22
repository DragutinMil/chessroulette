import { createContext } from 'react';
import { MatchState } from '../../room/activities/Match/movex';

export type MatchStateContextType = Pick<
  MatchState,
  'type' | 'rounds' | 'status'
>;

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
});
