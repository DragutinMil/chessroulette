import { createContext } from 'react';
import type { MatchPlayers, MatchState } from '../movex';
import { Old_Play_Results } from '@app/modules/Match/Play';
import { EndedGame, NotEndedGame } from '@app/modules/Game';

export type MatchStateContextType = Pick<
  NonNullable<MatchState>,
  'type' | 'rounds' | 'status' | 'winner' | 'gameInPlay'
> & {
  players: MatchPlayers | null;
  currentRound: number;
  // ongoingGame?: NotEndedGame;
  lastEndedGame: EndedGame | null;
  drawsCount: number;
  endedGamesCount: number;

  // TODO: This should be translated to MatchResults
  results: Old_Play_Results;
};

export const MatchStateContext = createContext<MatchStateContextType>({
  type: 'openEnded',
  status: 'pending',
  endedGamesCount: 0,
  drawsCount: 0,
  currentRound: 1,
  gameInPlay: null,
  lastEndedGame: null,
  results: {
    black: 0,
    white: 0,
  },
  winner: null,
  players: null,
});
