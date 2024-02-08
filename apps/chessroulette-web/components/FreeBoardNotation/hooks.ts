import useEventListener from '@use-it/event-listener';
import {
  FBHHistory,
  FBHIndex,
  FreeBoardHistory,
  keyInObject,
} from '@xmatter/util-kit';

export const useKeysToRefocusHistory = (
  history: FBHHistory,
  currentIndex: FBHIndex,
  onRefocus: (i: FBHIndex) => void
) => {
  useEventListener('keydown', (event: object) => {
    if (
      !(
        keyInObject(event, 'key') &&
        (event.key === 'ArrowRight' || event.key === 'ArrowLeft')
      )
    ) {
      return;
    }

    const nextIndex = findNextValidMoveIndex(
      history,
      currentIndex,
      event.key === 'ArrowRight' ? 'right' : 'left'
    );

    const isStartingIndex = FreeBoardHistory.areIndexesEqual(
      nextIndex,
      FreeBoardHistory.getStartingIndex()
    );

    if (
      FreeBoardHistory.findMoveAtIndex(history, nextIndex) ||
      isStartingIndex
    ) {
      onRefocus(nextIndex);
    }
  });
};

/**
 * If there are non-moves, it skips over them
 *
 * @param index
 * @param dir
 * @returns
 */
const findNextValidMoveIndex = (
  history: FBHHistory,
  index: FBHIndex,
  dir: 'right' | 'left'
): FBHIndex => {
  const nextIndex =
    dir === 'right'
      ? FreeBoardHistory.incrementIndex(index)
      : FreeBoardHistory.decrementIndex(index);

  const nextMove = FreeBoardHistory.findMoveAtIndex(
    history,
    nextIndex
  );

  if (nextMove?.isNonMove) {
    return findNextValidMoveIndex(history, nextIndex, dir);
  }

  return nextIndex;
};
