import { createContext } from 'react';
import {
  FBHIndex,
  FreeBoardHistory,
  LongChessColor,
  noop,
} from '@xmatter/util-kit';
// import { GameDisplayState } from '../types';
// import { Game, GameOffer, initialPlayState } from '../movex';
import { UserId, UsersMap } from '@app/modules/user';
import { GameDisplayState } from '@app/modules/Play';
import { Game, GameOffer } from '../types';
import { initialPlayState } from '@app/modules/Play/movex';

export type GameContextProps = {
  displayState: GameDisplayState;
  realState: {
    turn: LongChessColor;
    game: Game;
  };
  actions: {
    onRefocus: (i: FBHIndex) => void;
  };
  players?: UsersMap | undefined;
  playerId: UserId | undefined;
  lastOffer: GameOffer | undefined;
};

export const initialGameContextState: GameContextProps = {
  displayState: {
    fen: '',
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    turn: 'white',
  },
  realState: {
    turn: 'white',
    game: initialPlayState.game,
  },
  actions: {
    onRefocus: noop,
  },

  // TODO: Add other stuff in here
  players: undefined,
  playerId: undefined,
  lastOffer: undefined,
};

export const GameContext = createContext<GameContextProps>(
  initialGameContextState
);
