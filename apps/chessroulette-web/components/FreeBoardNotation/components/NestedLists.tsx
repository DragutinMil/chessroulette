import { useMemo } from 'react';
import { List } from './List';
import { RowProps } from './Row';
import { FBHHistory, FBHIndex, FBHRecursiveIndexes, FreeBoardHistory } from '@xmatter/util-kit';

type Props = {
  branchedHistories: FBHHistory[];
  rootHistoryIndex: FBHIndex;
  onFocus: (i: FBHIndex) => void;
  onDelete: (i: FBHIndex) => void;
  focusedRecursiveIndexes?: FBHRecursiveIndexes;
  rowClassName?: RowProps['className'];
  className?: string;
};

export const NestedLists = ({
  branchedHistories,
  rootHistoryIndex,
  focusedRecursiveIndexes,
  className,
  rowClassName,
  onFocus,
  onDelete,
}: Props) => {
  const rootHistoryIndexWithoutNested = useMemo(
    () => [rootHistoryIndex[0], rootHistoryIndex[1]] satisfies FBHIndex,
    [rootHistoryIndex]
  );
  const [rootTurnIndex, rootMovePosition] = rootHistoryIndexWithoutNested;

  const constructNestedIndex = (
    [nestedHistoryTurnIndex, nestedHistoryMovePosition]: FBHIndex,
    paralelBranchIndex: number
  ): FBHIndex => {
    return [
      rootTurnIndex,
      rootMovePosition,
      [
        // Substract the upper turnIndex from the nested one
        // [nestedHistoryTurnIndex - turnIndex, nestedHistoryMovePosition],
        [nestedHistoryTurnIndex, nestedHistoryMovePosition],
        paralelBranchIndex,
      ],
    ];
  };

  return (
    <>
      <span
        className=""
        style={{
          fontSize: 9,
        }}
      >
        {/* NHI: {FreeBoardHistory.renderIndex(rootHistoryIndex)} */}
      </span>
      {branchedHistories.map((branchedHistory, branchIndex) => {
        return (
          <List
            key={`${rootTurnIndex}-${rootMovePosition}--${branchIndex}`}
            history={branchedHistory}
            onRefocus={(nestedIndex) => {
              onFocus(constructNestedIndex(nestedIndex, branchIndex));
            }}
            onDelete={(nestedIndex) => {
              onDelete(constructNestedIndex(nestedIndex, branchIndex));
            }}
            className={className}
            rowClassName={rowClassName}
            isNested
            rootHistoryIndex={rootHistoryIndexWithoutNested}
            focusedIndex={
              focusedRecursiveIndexes?.[0] !== -1 &&
              focusedRecursiveIndexes?.[1] === branchIndex
                ? focusedRecursiveIndexes[0]
                : undefined
            }
          />
        );
      })}
    </>
  );
};
