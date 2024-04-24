import {
  BlackShortColor,
  FBHIndex,
  FBHRecursiveBlackMove,
  FBHRecursiveWhiteMove,
  FreeBoardHistory,
  WhiteShortColor,
} from '@xmatter/util-kit';
import { RowItem } from './RowItem';
import { MouseEvent } from 'react';

type Props = {
  rootHistoryIndex: FBHIndex;
  isFocused: boolean;
  onFocus: (index: FBHIndex) => void;
  onContextMenu: (event: MouseEvent) => void;
} & (
  | {
      color: WhiteShortColor;
      move: FBHRecursiveWhiteMove;
    }
  | {
      color: BlackShortColor;
      move?: FBHRecursiveBlackMove;
    }
);

// TODO: Make this part of the util
const constructNestedIndex = (
  nonRecursiveIndex: FBHIndex,
  nestedIndex: FBHIndex,
  paralelBranchIndex: number
): FBHIndex => [
  nonRecursiveIndex[0],
  nonRecursiveIndex[1],
  [nestedIndex, paralelBranchIndex],
];

export const HistoryMove = ({
  move,
  onFocus,
  onContextMenu,
  isFocused,
  rootHistoryIndex,
}: Props) => {
  if (!move) {
    return <div className="flex-1" />;
  }

  return (
    <RowItem
      san={move.san}
      isFocused={isFocused}
      onClick={() => onFocus(rootHistoryIndex)}
      onContextMenu={onContextMenu}
      variantMenu={
        isFocused && move.branchedHistories && move.branchedHistories.length > 0
          ? {
              items: move.branchedHistories.map((h, i) => {
                const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
                  h,
                  FreeBoardHistory.getStartingIndex(),
                  'right'
                );

                return {
                  value:
                    FreeBoardHistory.findMoveAtIndex(h, nextIndex)?.san || '',
                  onSelect: () =>
                    onFocus(
                      constructNestedIndex(rootHistoryIndex, nextIndex, i)
                    ),
                };
              }),
            }
          : undefined
      }
    />
  );
};
