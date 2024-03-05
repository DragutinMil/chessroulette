import React, { useEffect, useState } from 'react';
import { List, ListProps } from './components/List';
import { useKeysToRefocusHistory } from './hooks';
import { FBHHistory, FBHIndex, FreeBoardHistory } from '@xmatter/util-kit';

export type FreeBoardNotationProps = {
  history?: FBHHistory;
  focusedIndex?: ListProps['focusedIndex'];
  onRefocus: ListProps['onRefocus'];
  onDelete: ListProps['onDelete'];
  emptyContent?: string | React.ReactNode;
  className?: string;
  containerClassName?: string;
};

/**
 * A component that works with FreeBoardHistory library (util-kit), and is able to render free moves
 *
 * @param param0
 * @returns
 */
export const FreeBoardNotation: React.FC<FreeBoardNotationProps> = ({
  history = [],
  emptyContent = 'Wow, So Empty!',
  focusedIndex = FreeBoardHistory.getStartingIndex(),
  onRefocus,
  onDelete,
  containerClassName = '',
  className = '',
}) => {
  // const [showVariantMenuAt, setShowVariantMenuAt] = useState<FBHIndex>();
  useKeysToRefocusHistory(history, focusedIndex, onRefocus);

  useEffect(() => {
    console.log('FocusedIndex updated', focusedIndex);
  }, [focusedIndex])

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 min-w-0 ${containerClassName} `}
    >
      <div className="bg-purple-800 p-1 text-xs">
        {FreeBoardHistory.renderIndex(focusedIndex)}
      </div>
      {history.length > 0 ? (
        <List
          history={history}
          focusedIndex={focusedIndex}
          onRefocus={onRefocus}
          onDelete={onDelete}
          className={`flex flex-1 flex-col overflow-scroll ${className}`}
          rowClassName="border-b border-slate-600"
          // showVariantMenuAt={showVariantMenuAt}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          {emptyContent}
        </div>
      )}
    </div>
  );
};
