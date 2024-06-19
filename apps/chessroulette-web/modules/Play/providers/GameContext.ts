import { createContext } from 'react';
import {
  ChessFEN,
  FBHHistory,
  FBHIndex,
  FBHMove,
  FreeBoardHistory,
  ShortChessMove,
  noop,
} from '@xmatter/util-kit';

export type GameContextProps = {
  displayState: {
    fen: ChessFEN;
    history: FBHHistory;
    focusedIndex: FBHIndex;
    lastMove?: ShortChessMove;
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
  },
  actions: {
    onRefocus: noop,
  },

  // TODO: Add other stuff in here
};

export const GameContext = createContext<GameContextProps>(
  initialGameContextState
);
