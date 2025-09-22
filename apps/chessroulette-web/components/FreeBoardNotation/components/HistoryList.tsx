import React, { useEffect, useMemo, useRef } from 'react';
import debounce from 'debounce';
import useDebouncedEffect from 'use-debounced-effect';
import { HistoryRow } from './HistoryRow';
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
  className?: string;
  userSideReview?: string;
  rowClassName?: string;
  canDelete?: boolean;
  reviewData: EvaluationMove[];
  playerNames?:Array<string> 
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

export const List: React.FC<ListProps> = ({
  history,
  focusedIndex,
  onRefocus,
  onDelete,
  className,
  rowClassName,
  rootHistoryIndex,
  userSideReview,
  isNested = false,
  canDelete,
  playerNames,
  reviewData,
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

  const [focusedTurnIndex, focusedMovePosition, recursiveFocusedIndexes] =
    focusedIndex || [];

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
    <div>
      <div className="flex  mb-2 ">
        <p className="text-[#8F8F90] text-[10px] font-bold">MOVE</p>
        <div className="flex  w-full">
          <p className="text-[#8F8F90] text-[10px] font-bold w-[51%] ml-[7px] ">
            WHITE 
          { playerNames && (
            
           <span className='text-white'>
             &nbsp; &nbsp;{userSideReview === "w"
    ? ` ${playerNames?.[0] ?? ""} `
    : ` ${playerNames?.[1] ?? ""} `}
            
    </span>
            
          ) }  
           
          </p>

          <p className="text-[#8F8F90] text-[10px] font-bold   ">
            BLACK
            { playerNames && (
             
              <span className='text-white'>
                 &nbsp; &nbsp;
            {userSideReview === "b"
    ? ` ${playerNames?.[0] ?? ""} `
    : ` ${playerNames?.[1] ?? ""} `}
    </span>
            
             ) }  
          </p>
        </div>
      </div>
      <div
        className={`${className}`}
        ref={(e) => (containerElementRef.current = e)}
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
  );
};
