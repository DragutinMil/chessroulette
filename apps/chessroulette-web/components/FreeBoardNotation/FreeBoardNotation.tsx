import React from 'react';
import { List, ListProps } from './components/HistoryList';
import { useKeysToRefocusHistory } from './hooks';
import { FBHHistory, FreeBoardHistory } from '@xmatter/util-kit';
import type { EvaluationMove } from '../../modules/Room/activities/Review/movex/types';
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
  isAichess?: boolean;
  playersBySide?: any;
  reviewDataToNotation?: EvaluationMove[];
  playerNames?: Array<string>;
  isMobile?: boolean;
  showNames?: boolean;
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
  isAichess,
  canDelete,
  reviewDataToNotation,
  playersBySide,
  playerNames,
  isMobile,
  containerClassName = '',
  className = '',
  showNames,
}) => {
  useKeysToRefocusHistory(
    history,
    focusedIndex,
    onRefocus,
    isFocusedInput as boolean
  );

  return (
    <div
      className={`md:flex flex-col h-full w-full flex-1 overflow-hidden no-scrollbar   min-h-0 min-w-0 ${containerClassName} `}
    >
      {history.length > 0 ? (
        <List
          isMobile={isMobile}
          history={history}
          playerNames={playerNames}
          isAichess={isAichess}
          focusedIndex={focusedIndex}
          onRefocus={onRefocus}
          playersBySide={playersBySide}
          onDelete={onDelete}
          reviewDataToNotation={reviewDataToNotation || []}
          showNames={showNames}
          className={`flex flex-1 flex-col  ${className} ${
            canDelete === false ? 'hidden md:flex' : 'flex'
          }`}
          rowClassName={isMobile ? '' : ' border-slate-800'}
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
