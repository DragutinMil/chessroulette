import React from 'react';
import { List, ListProps } from './components/HistoryList';
import { useKeysToRefocusHistory } from './hooks';
import { FBHHistory, FreeBoardHistory } from '@xmatter/util-kit';
import type { EvaluationMove } from '../../modules/Room/activities/Aichess/movex/types';
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
  userSideReview?: string;
  reviewData?: EvaluationMove[];
  playerNames?:Array<string>
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
  reviewData,
  userSideReview,
  playerNames,
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
      className={`md:flex flex-col h-full flex-1  overflow-scroll  no-scrollbar   min-h-0 min-w-0 ${containerClassName} `}
    >
     
      {history.length > 0  ? (
        <List
          history={history}
          userSideReview={userSideReview}
          playerNames={playerNames}
          focusedIndex={focusedIndex}
          onRefocus={onRefocus}
          onDelete={onDelete}
          reviewData={reviewData || []}
          className={`flex flex-1 flex-col overflow-scroll  no-scrollbar ${className} ${
            canDelete === false ? 'hidden md:flex' : 'flex'
          }`}
          rowClassName="border-b border-slate-800"
          canDelete={canDelete}
        />
      ) : (
        <div className="flex-1 flex items-center   hidden md:flex  justify-center text-slate-500">
          {emptyContent}
        </div>
      )}
    </div>
  );
};
