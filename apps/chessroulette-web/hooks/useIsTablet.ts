import { useEffect, useState } from 'react';
import debounce from 'debounce';

const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

const getBreakpoints = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false };
  }

  const width = window.innerWidth;

  return {
    isMobile: width < TABLET_MIN_WIDTH,
    isTablet: width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH,
  };
};

export const useIsTablet = () => {
  const [breakpoints, setBreakpoints] = useState(getBreakpoints);

  useEffect(() => {
    const onResize = debounce(() => setBreakpoints(getBreakpoints()), 250);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return breakpoints;
};
