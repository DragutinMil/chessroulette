import React from 'react';
import { HistoryList, HistoryListProps } from './components_NEW/HistoryList';
import { ChessRecursiveHistory } from './types';
import { useKeysToRefocusHistory } from './hooks';
import { ChessRecursiveHistory_NEW } from './history/types';

export type GameHistoryProps = {
  history: ChessRecursiveHistory_NEW;
  focusedIndex: HistoryListProps['focusedIndex'];
  onRefocus: HistoryListProps['onRefocus'];
  onDelete: HistoryListProps['onDelete'];

  emptyContent?: string | React.ReactNode;

  className?: string;
  containerClassName?: string;

  // @deprecated
  showRows?: number;
};

export const GameHistory: React.FC<GameHistoryProps> = ({
  history = [],

  emptyContent = 'Wow, so empty!',
  showRows = 4,
  focusedIndex = [-1, 1],
  onRefocus,
  onDelete,
  ...props
}) => {
  // TODO: Add this back
  useKeysToRefocusHistory(history, focusedIndex, onRefocus);

  // console.log('Game History', history);

  return (
    <div className={`flex flex-1 ${props.containerClassName}`}>
      <HistoryList
        history={history}
        focusedIndex={focusedIndex}
        onRefocus={onRefocus}
        onDelete={onDelete}
        className="flex flex-1 flex-col"
        rowClassName="border-b border-slate-600"
      />
    </div>
  );
};
