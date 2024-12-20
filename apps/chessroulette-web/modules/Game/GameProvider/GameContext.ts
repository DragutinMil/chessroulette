import { createContext } from 'react';
import {
  ChessColor,
  FBHIndex,
  FreeBoardHistory,
  noop,
} from '@xmatter/util-kit';
import { UserId, UsersMap } from '@app/modules/User';
import { Game, GameDisplayState, GameOffer } from '../types';
import { initialPlayState } from '@app/modules/Match/Play/store';

export type GameContextProps = {
  displayState: GameDisplayState;
  committedState: {
    turn: ChessColor;
    game: Game;
  };
  actions: {
    onRefocus: (i: FBHIndex) => void;
  };
  players?: UsersMap;
  playerId?: UserId;
  lastOffer?: GameOffer;
};

export const initialGameContextState: GameContextProps = {
  displayState: {
    fen: '',
    history: [],
    focusedIndex: FreeBoardHistory.getStartingIndex(),
    turn: 'w',
  },
  committedState: {
    turn: 'w',
    game: initialPlayState,
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
