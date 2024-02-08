import React, { useEffect, useRef } from 'react';
import debounce from 'debounce';
import useDebouncedEffect from 'use-debounced-effect';
import { HistoryRow } from './HistoryRow';
import { FBHHistory, FBHIndex } from '@xmatter/util-kit';

export type HistoryListProps = {
  history: FBHHistory;
  onRefocus: (atIndex: FBHIndex) => void;
  onDelete: (atIndex: FBHIndex) => void;
  focusedIndex?: FBHIndex;
  className?: string;
  rowClassName?: string;
} & (
  | {
      isNested: true;
      rootHistoryIndex: FBHIndex;
    }
  | {
      isNested?: false;
      rootHistoryIndex?: undefined;
    }
);

const scrollIntoView = debounce((elm: HTMLDivElement) => {
  elm.scrollIntoView({ block: 'end', behavior: 'auto' });
}, 5);

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  focusedIndex,
  onRefocus,
  onDelete,
  className,
  rowClassName,
  rootHistoryIndex,
  isNested = false,
}) => {
  const rowElementRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerElementRef = useRef<HTMLDivElement | null>();

  useDebouncedEffect(
    () => {
      if (isNested) {
        return;
      }

      if (history.length === 0) {
        return;
      }

      if (!focusedIndex) {
        return;
      }

      const [focusedTurnIndex] = focusedIndex;

      if (!focusedTurnIndex) {
        return;
      }

      const elm = rowElementRefs.current[focusedTurnIndex];

      if (elm) {
        scrollIntoView(elm);
      }
    },
    100,
    [history, focusedIndex, isNested]
  );

  useEffect(() => {
    setTimeout(() => {
      if (containerElementRef.current) {
        containerElementRef.current.scrollTo(0, 9999);
      }
    }, 100);
  }, []);

  const [focusedTurnIndex, focusedMovePosition, recusriveFocusedIndexes] =
    focusedIndex || [];

  return (
    <div className={className} ref={(e) => (containerElementRef.current = e)}>
      {history.map((historyTurn, historyTurnIndex) => {
        const rootHistoryTurnIndex = rootHistoryIndex?.[0] || 0;

        const rowId = `${rootHistoryTurnIndex + historyTurnIndex}.${
          historyTurn[0].san
        }-${historyTurn[1]?.san || ''}`;

        return (
          <HistoryRow
            key={rowId}
            rowId={rowId}
            ref={(r) => (rowElementRefs.current[historyTurnIndex] = r)}
            historyTurn={historyTurn}
            historyTurnIndex={historyTurnIndex}
            moveCount={rootHistoryTurnIndex + 1 + historyTurnIndex}
            onFocus={onRefocus}
            onDelete={onDelete}
            focusedOnMovePosition={
              historyTurnIndex === focusedTurnIndex
                ? focusedMovePosition
                : undefined
            }
            focusedOnRecursiveIndexes={
              historyTurnIndex === focusedTurnIndex
                ? recusriveFocusedIndexes
                : undefined
            }
            containerClassName={rowClassName}
            {...(isNested
              ? {
                  isNested: true,
                  rootHistoryIndex,
                }
              : {
                  isNested: false,
                })}
          />
        );
      })}
    </div>
  );
};
