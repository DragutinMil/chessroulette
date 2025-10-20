import React, { useEffect, useMemo, useRef } from 'react';
import debounce from 'debounce';
import useDebouncedEffect from 'use-debounced-effect';
import { HistoryRow } from './HistoryRow';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/16/solid';

import {
  FBHHistory,
  FBHIndex,
  FBHMove,
  FreeBoardHistory,
} from '@xmatter/util-kit';
import type { EvaluationMove } from '../../../modules/Room/activities/Aichess/movex/types';

export type ListProps = {
  history: FBHHistory;
  onRefocus: (atIndex: FBHIndex) => void;
  onDelete: (atIndex: FBHIndex) => void;
  focusedIndex?: FBHIndex;
  isMobile?: boolean;
  className?: string;
  rowClassName?: string;
  canDelete?: boolean;
  reviewData: EvaluationMove[];
  playerNames?: Array<string>;
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
  elm.scrollIntoView({
    behavior: 'auto',
    block: 'nearest',
    inline: 'nearest',
  });
}, 10);

export const List: React.FC<ListProps> = ({
  history,
  isMobile,
  focusedIndex,
  onRefocus,
  onDelete,
  className,
  rowClassName,
  rootHistoryIndex,
  isNested = false,
  canDelete,
  playerNames,
  reviewData,
}) => {
  const rowElementRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerElementRef = useRef<HTMLDivElement | null>(null);
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
    const el = containerElementRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTo({
          top: el.scrollHeight,
          left: el.scrollWidth,
          behavior: 'auto',
        });
      }, 500);
      //  if (containerElementRef.current) {
      //   containerElementRef.current.scrollTo(0, 9999);
      // }
    }
  }, []);

  const [focusedTurnIndex, focusedMovePosition, recursiveFocusedIndexes] =
    focusedIndex || [];

  const backFocus = async () => {
    if (focusedIndex) {
      let moveNum;
      let moveTurn;
      if (focusedIndex[1] === 0 && focusedIndex[0] !== 0) {
        moveNum = 1;
        moveTurn = focusedIndex[0] - 1;
        onRefocus([moveTurn, moveNum as any]);
      }
      if (focusedIndex[1] === 1) {
        moveNum = 0;
        moveTurn = focusedIndex[0];
        onRefocus([moveTurn, moveNum as any]);
      }
    }
  };
  const forwardFocus = async () => {
    if (focusedIndex) {
      //console.log('history[history.length][1]',history[history.length][1])
      console.log('history.length', history.length, focusedIndex[0] + 2);
      //  history[history.length][1])
      let moveNum;
      let moveTurn;
      if (
        (focusedIndex[1] === 0 && history.length !== focusedIndex[0] + 1) ||
        (history.length == focusedIndex[0] + 1 &&
          history[history.length - 1]?.[1] !== undefined)
      ) {
        moveNum = 1;
        moveTurn = focusedIndex[0];
        onRefocus([moveTurn, moveNum as any]);
      }

      if (focusedIndex[1] === 1 && history.length > focusedIndex[0] + 1) {
        moveNum = 0;
        moveTurn = focusedIndex[0] + 1;
        onRefocus([moveTurn, moveNum as any]);
      }
    }
  };
  const nextValidMoveAndIndex = useMemo<[FBHMove, FBHIndex] | undefined>(() => {
    if (!focusedIndex) {
      return undefined;
    }

    const index = FreeBoardHistory.findNextValidMoveIndex(
      history,
      focusedIndex,
      'right'
    );

    const move = FreeBoardHistory.findMoveAtIndex(history, index);

    if (!move) {
      return undefined;
    }

    return [move, index];
  }, [history, focusedIndex]);

  return (
    <div className="flex md:flex-col flex-row h-full ">
      {!isNested && (
        <div className="hidden md:flex   mb-2  ">
          <p className="text-[#8F8F90] text-[10px] font-bold">MOVE</p>
          <div className="flex  w-full">
            <p className="text-[#8F8F90] md: text-[10px] font-bold w-[51%] ml-[7px] ">
              WHITE
              {playerNames && (
                <span className="text-white">&nbsp; {playerNames[0]}</span>
              )}
            </p>

            <p className="text-[#8F8F90] text-[10px] font-bold   ">
              BLACK
              {playerNames && (
                <span className="text-white">&nbsp; {playerNames[1]}</span>
              )}
            </p>
          </div>
        </div>
      )}

      <ChevronLeftIcon
        onClick={() => backFocus()}
        className="md:hidden flex -translate-x-1 scale-90"
      />
      <div
        className=" flex-1  overflow-scroll no-scrollbar"
        style={{ width: isMobile ? 'calc(100vw - 3rem - 68px)' : '' }}
        ref={(e) => (containerElementRef.current = e)}
      >
        <div
          className={`${className} `}
          style={{ flexDirection: isMobile ? 'row' : 'column' }}
        >
          {history.map((historyTurn, historyTurnIndex) => {
            const rootHistoryTurnIndex = rootHistoryIndex?.[0] || 0;

            const rowId = `${rootHistoryTurnIndex + historyTurnIndex}.${
              historyTurn[0].san
            }-${historyTurn[1]?.san || ''}`;
            const evalRow =
              reviewData?.length > 0
                ? [
                    reviewData[historyTurnIndex * 2].diff,
                    reviewData[(historyTurnIndex + 1) * 2 - 1]?.diff,
                  ]
                : [];
            const bestMovesEngine =
              reviewData?.length > 0
                ? [
                    reviewData[historyTurnIndex * 2 - 1]?.bestMoves,
                    reviewData[(historyTurnIndex + 1) * 2 - 2]?.bestMoves,
                  ]
                : [];

            return (
              <HistoryRow
                key={rowId}
                evalRow={evalRow}
                bestMovesEngine={bestMovesEngine}
                rowId={rowId}
                ref={(r) => (rowElementRefs.current[historyTurnIndex] = r)}
                canDelete={canDelete}
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
                    ? recursiveFocusedIndexes
                    : undefined
                }
                containerClassName={rowClassName}
                nextValidMoveAndIndex={nextValidMoveAndIndex}
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
      </div>
      <ChevronRightIcon
        onClick={() => forwardFocus()}
        className="md:hidden flex translate-x-1 scale-90"
      />
    </div>
  );
};
