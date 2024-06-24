import { createContext } from 'react';
import { MatchState } from '../../room/activities/Match/movex';
import { Results } from '../types';

export type MatchStateContextType = Pick<
  MatchState,
  'type' | 'rounds' | 'status'
> & {
  completedPlays: number;
  currentRound: number;
  results: Results;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  completedPlays: 0,
  currentRound: 1,
  results: {
    black: 0,
    white: 0,
  },
});
