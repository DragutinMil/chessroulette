import { useEffect, useMemo, useState } from 'react';
// import { ContainerDimensions } from './util';
import { useContainerDimensions } from 'apps/chessroulette-web/components/ContainerWithDimensions';

type CssSizeDetailed =
  | { val: number; unit: 'px' | '%' }
  | { val: number; unit: 'auto' };
type CssSize = CssSizeDetailed | 'auto' | number; // short for { val: number; unit: 'px' }

type CssContainerDimension = {
  width: CssSize;
  height: CssSize;
};

type State = {
  main: CssContainerDimension;
  side: CssContainerDimension;
};

export const useDesktopRoomLayout = (
  targetRef: React.RefObject<HTMLElement>,
  initialState: State = {
    main: {
      width: 'auto',
      height: 'auto',
    },
    side: {
      width: 'auto',
      height: 'auto',
    },
  },
  opts?: {
    sideMinWidth?: CssSize;
  }
) => {
  const containerDimensions = useContainerDimensions(targetRef);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState(calculate(containerDimensions, opts?.sideMinWidth));
  }, [containerDimensions]);

  return useMemo(
    () => ({
      main: {
        ...normalizeCssContainerDimension(state.main),
        asString: renderCssDimension(state.main),
      },
      side: {
        ...normalizeCssContainerDimension(state.side),
        asString: renderCssDimension(state.side),
      },
      container: containerDimensions,
      updated: containerDimensions.updated,
    }),
    [state, containerDimensions]
  );
};

const calculate = (
  cd: CssContainerDimension,
  sideMinWidth: CssSize = 0
): State => {
  const normalizedCd = normalizeCssContainerDimension(cd);
  const normalizedSideMinWidth = normalizeCssSize(sideMinWidth);

  // Main is always a square
  const defaultNextMain = {
    height: normalizedCd.height,
    width: normalizedCd.height,
  };

  const defaultNextSide = {
    width: normalizedCd.width.val - defaultNextMain.width.val, // TODO: here what could work is if there is a min width on the side to set it
    height: normalizedCd.height.val,
  };

  if (defaultNextSide.width < normalizedSideMinWidth.val) {
    const nextMainWidth = normalizedCd.width.val - normalizedSideMinWidth.val;

    return {
      side: {
        width: sideMinWidth,
        height: cd.height,
      },
      main: {
        // Main is always a square
        width: nextMainWidth,
        height: nextMainWidth,
      },
    };
  }

  return {
    main: defaultNextMain,
    side: defaultNextSide,
  };
};

const normalizeCssSize = (cs: CssSize): CssSizeDetailed => {
  if (typeof cs === 'number') {
    return {
      val: cs,
      unit: 'px',
    };
  }

  if (typeof cs === 'string') {
    return {
      val: 0,
      unit: 'auto',
      // val: 'auto',
      // unit: 'auto',
    };
  }

  return cs;
};

const normalizeCssContainerDimension = (
  cd: CssContainerDimension
): {
  width: CssSizeDetailed;
  height: CssSizeDetailed;
} => ({
  width: normalizeCssSize(cd.width),
  height: normalizeCssSize(cd.height),
});

// const substractCssSize = (a: CssSize, b: CssSize) => {
//   if (a.``)
// }

const renderCssSize = (cs: CssSize) => {
  const normalized = normalizeCssSize(cs);

  return normalized.unit === 'auto'
    ? 'auto'
    : `${normalized.val}${normalized.unit}`;
};

export const renderCssDimension = (cd: CssContainerDimension) => ({
  width: renderCssSize(cd.width),
  height: renderCssSize(cd.height),
});
