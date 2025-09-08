import {
  BlackShortColor,
  FBHIndex,
  FBHMove,
  FBHRecursiveBlackMove,
  FBHRecursiveWhiteMove,
  FreeBoardHistory,
  WhiteShortColor,
} from '@xmatter/util-kit';
import { RowItem } from './RowItem';
import { IconProps, Icon } from '../../Icon/Icon';
import { MouseEvent } from 'react';

type Props = {
  rootHistoryIndex: FBHIndex;
  isFocused: boolean;
  evalDiff: number;
  bestMoves: string[];
  onFocus: (index: FBHIndex) => void;
  onContextMenu: (event: MouseEvent) => void;
  nextValidMoveAndIndex?: [FBHMove, FBHIndex];
} & (
  | {
      color: WhiteShortColor;
      move: FBHRecursiveWhiteMove;
    }
  | {
      color: BlackShortColor;
      move?: FBHRecursiveBlackMove;
    }
);

// TODO: Make this part of the util
const constructNestedIndex = (
  nonRecursiveIndex: FBHIndex,
  nestedIndex: FBHIndex,
  paralelBranchIndex: number
): FBHIndex => [
  nonRecursiveIndex[0],
  nonRecursiveIndex[1],
  [nestedIndex, paralelBranchIndex],
];

export const HistoryMove = ({
  move,
  onFocus,
  onContextMenu,
  bestMoves,
  isFocused,
  rootHistoryIndex,
  nextValidMoveAndIndex,
  evalDiff,
}: Props) => {
  if (!move) {
    return <div className="flex-1" />;
  }

  // let iconic: React.ReactNode;

  // if (Number(evalDiff) <= -1) {
  //   iconic ='✅' ;
  // } else if (Number(evalDiff) <= -0.5) {
  //   iconic = "bad move";
  // } else if (Number(evalDiff) > -0.5 && Number(evalDiff) < 0.5) {
  //   iconic = "neutral";
  // } else if (Number(evalDiff) < 1) {
  //   iconic = "dobar";
  // } else {
  //   iconic = "veoma dobar";
  // }
  console.log('move conscat', move.from?.concat(move.to), bestMoves);

  const iconicEngine =
    bestMoves && move.from?.concat(move.to) == bestMoves[0]
      ? '🎯'
      : (bestMoves && move.from?.concat(move.to) == bestMoves[1]) ||
        (bestMoves && move.from?.concat(move.to) == bestMoves[2])
      ? '⚡'
      : '';

  const iconic =
    evalDiff <= -2
      ? '❌'
      : evalDiff <= -0.5
      ? '⬇️'
      : evalDiff > -0.5 && evalDiff < 0.3
      ? ''
      : evalDiff < 1
      ? '✅'
      : '✅✅';
  //➖
  const moveCoplete =
    evalDiff < -0.5 && iconicEngine !== ''
      ? `${move.san} ${iconic}`
      : evalDiff && iconicEngine !== ''
      ? `${move.san} ${iconic} ${iconicEngine}`
      : evalDiff
      ? `${move.san} ${iconic}`
      : `${move.san}`;

  //  if(evalDiff){
  //  console.log(evalDiff)
  //  }

  return (
    <RowItem
      san={moveCoplete}
      isFocused={isFocused}
      onClick={() => onFocus(rootHistoryIndex)}
      onContextMenu={onContextMenu}
      variantMenu={
        isFocused && move.branchedHistories && move.branchedHistories.length > 0
          ? {
              items: [
                ...(nextValidMoveAndIndex
                  ? [
                      {
                        value: nextValidMoveAndIndex[0].san,
                        onSelect: () => {
                          onFocus(
                            nextValidMoveAndIndex[1]
                            // constructNestedIndex(rootHistoryIndex, nextIndex, i)
                          );
                        },
                      },
                    ]
                  : []),
                ...move.branchedHistories.map((h, i) => {
                  const nextIndex = FreeBoardHistory.findNextValidMoveIndex(
                    h,
                    FreeBoardHistory.getStartingIndex(),
                    'right'
                  );

                  return {
                    value:
                      FreeBoardHistory.findMoveAtIndex(h, nextIndex)?.san || '',
                    onSelect: () =>
                      onFocus(
                        constructNestedIndex(rootHistoryIndex, nextIndex, i)
                      ),
                  };
                }),
              ],
            }
          : undefined
      }
    />
  );
};
