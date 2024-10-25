import { createContext } from 'react';
import { MatchViewState } from '../types';
import { MatchActions } from '../movex';
import { MovexDispatchAction } from 'movex';
import { noop } from '@xmatter/util-kit';

export type MatchContextType = MatchViewState & {
  dispatch: MovexDispatchAction<MatchActions>;
};

export const MatchStateContext = createContext<MatchContextType>({
  match: null,
  userAsPlayer: undefined,
  endedGamesCount: 0,
  currentRound: 1,
  lastEndedGame: undefined,
  drawsCount: 0,
  results: {
    black: 0,
    white: 0,
  },
  dispatch: noop,
});
