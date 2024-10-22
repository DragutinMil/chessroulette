import { createContext } from 'react';
import type { MatchPlayers, MatchState } from '../movex';
import { Old_Play_Results } from '@app/modules/Match/Play';
import { EndedGame } from '@app/modules/Game';
// import { Results } from '../../../../Play/types';

export type MatchStateContextType = Pick<
  NonNullable<MatchState>,
  'type' | 'rounds' | 'status' | 'winner'
> & {
  players: MatchPlayers | undefined;
  endedPlaysCount: number;
  currentRound: number;
  draws: number;
  // TODO: Rename to ongoingGame
  ongoingPlay?: NonNullable<MatchState>['ongoingPlay'];
  // TODO: Rename to lastEndedGame
  // lastEndedPlay?: EndedPlayState;
  lastEndedPlay?: EndedGame;
  // TODO: This should be translated to MatchResults
  results: Old_Play_Results;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  endedPlaysCount: 0,
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
