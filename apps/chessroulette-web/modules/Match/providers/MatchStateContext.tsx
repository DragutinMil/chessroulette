import { createContext } from 'react';
import type { MatchPlayers, MatchState } from '../movex';
import { EndedPlayState } from '@app/modules/Match/Play/movex';
import { Old_Play_Results } from '@app/modules/Match/Play';
// import { Results } from '../../../../Play/types';

export type MatchStateContextType = Pick<
  NonNullable<MatchState>,
  'type' | 'rounds' | 'status' | 'winner'
> & {
  players: MatchPlayers | undefined;
  completedPlaysCount: number;
  currentRound: number;
  draws: number;
  ongoingPlay?: NonNullable<MatchState>['ongoingPlay'];
  lastEndedPlay?: EndedPlayState;
  // TODO: This should be translated to MatchResults
  results: Old_Play_Results;
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
