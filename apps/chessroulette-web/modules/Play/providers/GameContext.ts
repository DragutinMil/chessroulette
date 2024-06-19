import { createContext } from 'react';
import {
  FBHIndex,
  FreeBoardHistory,
  LongChessColor,
  noop,
} from '@xmatter/util-kit';
import { GameDisplayState } from '../types';
import { Game, initialPlayState } from '../store';

export type GameContextProps = {
  displayState: GameDisplayState;
  realState: {
    turn: LongChessColor;
    game: Game;
  };
  actions: {
    onRefocus: (i: FBHIndex) => void;
  };
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
};

export const GameContext = createContext<GameContextProps>(
  initialGameContextState
);
