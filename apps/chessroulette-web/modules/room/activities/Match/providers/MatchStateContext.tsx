import { createContext } from 'react';
import { MatchState } from '../movex';
import { Results } from '../../../../Play/types';
import { EndedPlayState } from '@app/modules/Play';

export type MatchStateContextType = Pick<
  MatchState,
  'type' | 'rounds' | 'status' | 'winner'
> & {
  players: MatchState['players'] | undefined;
  completedPlaysCount: number;
  currentRound: number;
  draws: number;
  ongoingPlay?: MatchState['ongoingPlay'];
  lastEndedPlay?: EndedPlayState;
  // TODO: This should be translated to MatchResults
  results: Results;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  completedPlaysCount: 0,
  draws: 0,
  currentRound: 1,
  ongoingPlay: undefined,
  lastEndedPlay: undefined,
  results: {
    black: 0,
    white: 0,
  },
  winner: null,
  players: undefined,
});
