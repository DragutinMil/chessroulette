import { createContext } from 'react';
import { MatchState } from '../movex';
import { Results } from '../../../../Play/types';

export type MatchStateContextType = Pick<
  MatchState,
  'type' | 'rounds' | 'status' | 'winner'
> & {
  completedPlaysCount: number;
  currentRound: number;

  draws: number;

  ongoingPlay?: MatchState['ongoingPlay'];
  lastCompletedPlay?: MatchState['ongoingPlay'];
  // TODO: This should be translated to MatchResults
  results: Results;
  players: MatchState['players'] | undefined;

  _matchState?: MatchState;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  completedPlaysCount: 0,
  draws: 0,
  currentRound: 1,
  ongoingPlay: undefined,
  lastCompletedPlay: undefined,
  results: {
    black: 0,
    white: 0,
  },
  winner: undefined,
  players: undefined,
});
