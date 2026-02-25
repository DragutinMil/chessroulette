import {
  toChessArrowFromId,
  toChessArrowId,
  toDictIndexedBy,
  useCallbackIf,
} from '@xmatter/util-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { objectKeys } from 'movex-core-util';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { shallowEqualObjects } from 'shallow-equal';
import { Arrow } from 'react-chessboard'; //ovde samo react-chessboard al posle javlja gresku dole
import { ArrowsMap } from '../../types';
import type { Square } from 'chess.js';

export const useCustomArrows = (
  onUpdate?: (next: ArrowsMap) => void,
  arrowsMap?: ArrowsMap
) => {
  const [localBoardArrowsMap, setLocalBoardArrowsMap] = useState<ArrowsMap>({});

  useDeepCompareEffect(() => {
    onArrowsChangeCb(localBoardArrowsMap);
  }, [localBoardArrowsMap]);

  const onArrowsChangeCb = useCallback(
    (nextLocalBoardArrowsMap: ArrowsMap) => {
      if (!onUpdate) {
        return;
      }

      if (!shallowEqualObjects(nextLocalBoardArrowsMap, arrowsMap)) {
        // Send them all outside
        onUpdate({
          ...arrowsMap,
          ...nextLocalBoardArrowsMap,
        });
      }
    },
    [onUpdate, arrowsMap, localBoardArrowsMap]
  );

  const arrowsToRender = useMemo((): Array<{ startSquare: Square; endSquare: Square; color: string }> => {
    const map = arrowsMap || {};
    return objectKeys(map)
      .filter((id) => !Object(localBoardArrowsMap).hasOwnProperty(id))
      .map((id) => {
        const tuple = map[id];
        if (!tuple || tuple.length < 2) return null;
        return {
          startSquare: tuple[0],
          endSquare: tuple[1],
          color: tuple[2] ?? '',
        };
      })
      .filter((x): x is { startSquare: Square; endSquare: Square; color: string } => x != null);
  }, [localBoardArrowsMap, arrowsMap]);

  const [safelyMounted, setSafelyMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setSafelyMounted(true);
    }, 250);
  }, []);

  // const updateArrowsMap = useCallbackIf(
  //   safelyMounted,
  //   (nextArrows: Arrow[]) => {
  //     if (nextArrows.length === 0 && Object.keys(arrowsMap || {}).length > 0) {
  //       // Reset when the arrows are set back to 0
  //       onUpdate?.({});
  //       return;
  //     }
  //     console.log('nextArrows',nextArrows)
  //       console.log('toChessArrowId',toChessArrowId)
  //     setLocalBoardArrowsMap(toDictIndexedBy(nextArrows, toChessArrowId));
  //   },
  //   []
  // );

  return {
    // updateArrowsMap,
    arrowsToRender,
  };
};
