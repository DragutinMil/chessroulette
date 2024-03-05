import React from 'react';
import { Menu, Item, useContextMenu, ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { FBHIndex, FBHRecursiveIndexes, FBHTurn } from '@xmatter/util-kit';
import { Text } from '../../Text';
import { NestedLists } from './NestedHistoryLists';

export type RowProps = {
  rowId: string;
  historyTurn: FBHTurn;
  historyTurnIndex: number;
  onFocus: (i: FBHIndex) => void;
  onDelete: (i: FBHIndex) => void;
  focusedOnMovePosition?: 0 | 1;
  focusedOnRecursiveIndexes?: FBHRecursiveIndexes;
  className?: string;
  containerClassName?: string;
  moveCount?: number;
  // showVariantMenuAt?: FBHIndex;
} & (
  | {
      isNested: true;
      rootHistoryIndex: FBHIndex;
    }
  | {
      isNested?: boolean;
      rootHistoryIndex?: undefined;
    }
);

export const HistoryRow = React.forwardRef<HTMLDivElement | null, RowProps>(
  (
    {
      rowId,
      historyTurn: [whiteMove, blackMove],
      historyTurnIndex,
      onFocus,
      onDelete,
      className,
      containerClassName,
      moveCount = historyTurnIndex + 1,
      focusedOnMovePosition,
      focusedOnRecursiveIndexes,
      // showVariantMenuAt,
      isNested = false,
    },
    ref
  ) => {
    const whiteMoveIndex: FBHIndex = [historyTurnIndex, 0];
    const blackMoveIndex: FBHIndex = [historyTurnIndex, 1];

    const { show } = useContextMenu({ id: rowId });

    const handleOnDelete = ({ props }: ItemParams) => {
      if (props.color === 'white') {
        onDelete(whiteMoveIndex);
      }

      if (props.color === 'black') {
        onDelete(blackMoveIndex);
      }
    };

    const shouldSplit = !!whiteMove.branchedHistories;

    const blackMoveRender = blackMove ? (
      <Text
        className={`flex-1 cursor-pointer p-1 hover:bg-slate-500 ${
          // focus === 1 && 'font-black bg-slate-600'
          !focusedOnRecursiveIndexes &&
          focusedOnMovePosition === 1 &&
          'font-black bg-slate-600'
        }`}
        onClick={() => {
          if (!blackMove.isNonMove) {
            onFocus(blackMoveIndex);
          }
        }}
        onContextMenu={(event) => show({ event, props: { color: 'black' } })}
      >
        <Text
          className="bg-slate-900 text-white mr-1 p-1"
          style={{
            fontSize: 11,
          }}
        >
          [{historyTurnIndex}, 1]
        </Text>
        {blackMove.san}
      </Text>
    ) : (
      <div className="flex-1" />
    );

    return (
      <div className={containerClassName} ref={isNested ? undefined : ref}>
        <div className={`flex ${className} ${shouldSplit && 'flex-col'}`}>
          <div id="header" className="flex flex-1">
            <Text className="flex-0 p-1 pr-2 cursor-pointer">{moveCount}.</Text>
            <Text
              className={`flex-1 cursor-pointer p-1 sbg-slate-600 hover:bg-slate-500 ${
                // focus === 0 && 'font-black bg-slate-600'
                !focusedOnRecursiveIndexes &&
                focusedOnMovePosition === 0 &&
                'font-black bg-slate-600'
              }`}
              onContextMenu={(event) =>
                show({ event, props: { color: 'white' } })
              }
              onClick={() => {
                if (!whiteMove.isNonMove) {
                  onFocus(whiteMoveIndex);
                }
              }}
            >
              <Text
                className="bg-slate-200 text-black mr-1 p-1"
                style={{
                  fontSize: 11,
                }}
              >
                [{historyTurnIndex}, 0]
              </Text>
              {whiteMove.san}
            </Text>

            {shouldSplit ? (
              <Text
                className={`flex-1 cursor-pointer p-1 hover:bg-slate-500`}
                onContextMenu={(event) =>
                  show({ event, props: { color: 'white' } })
                }
              >
                ...
              </Text>
            ) : (
              blackMoveRender
            )}
          </div>
          {whiteMove.branchedHistories && (
            <NestedLists
              branchedHistories={whiteMove.branchedHistories}
              rootHistoryIndex={[historyTurnIndex, 0]}
              onFocus={onFocus}
              onDelete={onDelete}
              className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-red-500"
              rowClassName={containerClassName}
              focusedRecursiveIndexes={focusedOnRecursiveIndexes}
              // focusedRecursiveIndexes={focusedNestedIndex}
            />
          )}
          {shouldSplit && (
            <div className="flex flex-1">
              <Text className="flex-0 p-1 pr-2 cursor-pointer">
                {moveCount}.
              </Text>
              <Text
                className="flex-1 cursor-pointer p-1 hover:bg-slate-500"
                onContextMenu={(event) =>
                  show({ event, props: { color: 'black' } })
                }
              >
                ...
              </Text>
              {blackMoveRender}
            </div>
          )}
        </div>

        {blackMove?.branchedHistories && (
          <NestedLists
            branchedHistories={blackMove.branchedHistories}
            rootHistoryIndex={[historyTurnIndex, 1]}
            onFocus={onFocus}
            onDelete={onDelete}
            className="pl-2 mt-2 border-l border-slate-500 ml-1 sbg-blue-500"
            rowClassName={containerClassName}
            focusedRecursiveIndexes={focusedOnRecursiveIndexes}
            // focusedRecursiveIndexes={focusedNestedIndex}
          />
        )}
        <Menu id={rowId}>
          <Item
            id="delete"
            onClick={handleOnDelete}
            className="hover:cursor-pointer"
          >
            Delete from here
          </Item>
        </Menu>
      </div>
    );
  }
);
