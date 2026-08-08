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
  // Starts at the SSR-safe default on both server and the client's first
  // render (avoids a hydration mismatch), then syncs to the real breakpoint
  // right after mount.
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isTablet: false,
  });

  useEffect(() => {
    setBreakpoints(getBreakpoints());
    const onResize = debounce(() => setBreakpoints(getBreakpoints()), 250);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return breakpoints;
};
