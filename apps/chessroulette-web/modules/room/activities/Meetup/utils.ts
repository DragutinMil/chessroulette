import {
  ChessPGN,
  FBHHistory,
  FBHIndex,
  FreeBoardHistory,
  pgnToFen,
} from '@xmatter/util-kit';

const getLastMove = (history: FBHHistory, atIndex: FBHIndex) => {
  const lm = FreeBoardHistory.findMoveAtIndex(history, atIndex);

  return lm?.isNonMove ? undefined : lm;
};

// TODO: @deprecate this in favor of modules/Play getGameDisplayState
export const getDisplayStateFromPgn = (
  pgn: ChessPGN,
  focusedIndex?: FBHIndex
) => {
  const allHistory = FreeBoardHistory.pgnToHistory(pgn);

  if (!focusedIndex) {
    const lastFocusedIndex = FreeBoardHistory.getLastIndexInHistory(allHistory);

    return {
      fen: pgnToFen(pgn),
      history: allHistory,
      focusedIndex: FreeBoardHistory.getLastIndexInHistory(allHistory),
      lastMove: getLastMove(allHistory, lastFocusedIndex),
    } as const;
  }

  const [historyAtIndex, lastFocusedIndex] = FreeBoardHistory.sliceHistory(
    allHistory,
    FreeBoardHistory.incrementIndex(focusedIndex)
  );

  return {
    fen: FreeBoardHistory.historyToFen(historyAtIndex),
    history: allHistory,
    focusedIndex: lastFocusedIndex,
    lastMove: getLastMove(historyAtIndex, lastFocusedIndex),
  };
};
