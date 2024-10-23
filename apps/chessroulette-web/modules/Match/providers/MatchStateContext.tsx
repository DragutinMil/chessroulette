import { createContext } from 'react';
import type { MatchPlayers, MatchState } from '../movex';
import { Old_Play_Results } from '@app/modules/Match/Play';
import { EndedGame, NotEndedGame } from '@app/modules/Game';
import { DistributiveOmit } from '@xmatter/util-kit';

export type MatchStateContextType =
  | (NonNullable<MatchState> & {
      // players: MatchPlayers | null;
      // ongoingGame?: NotEndedGame;
      currentRound: number;
      lastEndedGame: EndedGame | null;
      drawsCount: number;
      endedGamesCount: number;

      // TODO: This should be translated to MatchResults
      results: Old_Play_Results;
    })
  | undefined;

export const MatchStateContext =
  createContext<MatchStateContextType>(undefined);
// export const MatchStateContext = createContext<MatchStateContextType>({
//   type: 'openEnded',
//   status: 'pending',
//   endedGamesCount: 0,
//   drawsCount: 0,
//   currentRound: 1,
//   gameInPlay: null,
//   lastEndedGame: null,
//   results: {
//     black: 0,
//     white: 0,
//   },
//   winner: null,
//   players: null,
// });
