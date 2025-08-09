import React from 'react';
import { List, ListProps } from './components/HistoryList';
import { useKeysToRefocusHistory } from './hooks';
import { FBHHistory, FreeBoardHistory } from '@xmatter/util-kit';

export type FreeBoardNotationProps = {
  history?: FBHHistory;
  isFocusedInput?: boolean;
  focusedIndex?: ListProps['focusedIndex'];
  onRefocus: ListProps['onRefocus'];
  onDelete: ListProps['onDelete'];
  emptyContent?: string | React.ReactNode;
  className?: string;
  containerClassName?: string;
  canDelete?: boolean;
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
  isFocusedInput,
  focusedIndex = FreeBoardHistory.getStartingIndex(),
  onRefocus,
  onDelete,
  canDelete,
  containerClassName = '',
  className = '',
}) => {
  useKeysToRefocusHistory(
    history,
    focusedIndex,
    onRefocus,
    isFocusedInput as boolean
  );
  return (
    <div
      className={`md:flex flex-col flex-1  overflow-scroll  min-h-0 min-w-0 ${containerClassName} `}
    >
      {history.length > 0 ? (
        <List
          history={history}
          focusedIndex={focusedIndex}
          onRefocus={onRefocus}
          onDelete={onDelete}
          className={`flex flex-1 flex-col overflow-scroll  ${className} ${
            canDelete === false ? 'hidden md:flex' : 'flex'
          }`}
          rowClassName="border-b border-slate-800"
          canDelete={canDelete}
        />
      ) : (
        <div className="flex-1 flex items-center  hidden md:flex  justify-center text-slate-500">
          {emptyContent}
        </div>
      )}
    </div>
  );
};
