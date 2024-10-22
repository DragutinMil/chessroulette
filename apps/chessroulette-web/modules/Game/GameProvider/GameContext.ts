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
// import { GameDisplayState } from '@app/modules/Play';
import { Game, GameDisplayState, GameOffer } from '../types';
import { initialPlayState } from '@app/modules/Match/Play/store';

export type GameContextProps = {
  displayState: GameDisplayState;
  committedState: {
    turn: LongChessColor;
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
    turn: 'white',
  },
  committedState: {
    turn: 'white',
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
