import useEventListener from '@use-it/event-listener';
import {
  FBHHistory,
  FBHIndex,
  FBHRecursiveMove,
  FreeBoardHistory,
  keyInObject,
} from '@xmatter/util-kit';

export const useKeysToRefocusHistory = (
  history: FBHHistory,
  currentIndex: FBHIndex,
  onRefocus: (i: FBHIndex, move?: FBHRecursiveMove) => void
  // onChooseVariant: () => void,
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

    const foundMove = FreeBoardHistory.findMoveAtIndex(history, nextIndex);

    if ((foundMove || isStartingIndex) && isDifferentThanCurrent) {
      onRefocus(nextIndex, foundMove);
    }
  });

  // TODO: might need to optimize the onRefocus callback updates
};
