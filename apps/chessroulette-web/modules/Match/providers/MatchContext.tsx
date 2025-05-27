import { createContext } from 'react';
import { MatchViewState } from '../types';
import { RematchViewState } from '../types';
import { MatchActions } from '../movex';
import { MovexDispatchAction } from 'movex';
import { noop } from '@xmatter/util-kit';
import { boolean } from 'zod';

export type MatchContextType = MatchViewState & {
  dispatch: MovexDispatchAction<MatchActions>;
};
export type RematchContextType = RematchViewState & {
  dispatch: MovexDispatchAction<MatchActions>;
};

export const MatchRematchContext = createContext<RematchContextType>({
  rematch: false,
  dispatch: noop,
});
export const MatchStateContext = createContext<MatchContextType>({
  match: null,
  userAsPlayer: undefined,
  endedGamesCount: 0,
  currentRound: 1,
  previousGame: undefined,
  drawsCount: 0,
  results: {
    challengee: {
      points: 0,
    },
    challenger: {
      points: 0,
    },
  },
  dispatch: noop,

  // deprecate
  // results: {
  //   black: 0,
  //   white: 0,
  // },
});
