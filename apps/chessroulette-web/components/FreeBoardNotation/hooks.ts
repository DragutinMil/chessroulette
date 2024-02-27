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

    const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
      history,
      currentIndex,
      event.key === 'ArrowRight' ? 'right' : 'left'
    );

    const isStartingIndex = FreeBoardHistory.areIndexesEqual(
      nextIndex,
      FreeBoardHistory.getStartingIndex()
    );

    const isDifferentThanCurrent = !FreeBoardHistory.areIndexesEqual(
      nextIndex,
      currentIndex
    );

    if (
      (FreeBoardHistory.findMoveAtIndex(history, nextIndex) ||
        isStartingIndex) &&
      isDifferentThanCurrent
    ) {
      onRefocus(nextIndex);
    }
  });
};
