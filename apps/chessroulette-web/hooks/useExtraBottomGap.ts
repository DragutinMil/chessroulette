'use client';
import { useEffect, useState } from 'react';

// RoomTemplate sizes its root with h-screen (100vh), which on mobile Safari
// reports a taller value than the actually visible innerHeight — the
// difference is silently clipped by overflow-hidden. This measures that gap
// so callers can add it as extra bottom spacing (Chrome has ~0 gap, so it's
// a no-op there).
export const useExtraBottomGap = () => {
  const [extraBottomGap, setExtraBottomGap] = useState(0);

  useEffect(() => {
    const measureGap = () => {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;top:0;left:0;height:100vh;width:0;visibility:hidden;pointer-events:none;';
      document.body.appendChild(probe);
      const vhPx = probe.getBoundingClientRect().height;
      document.body.removeChild(probe);
      setExtraBottomGap(Math.max(0, vhPx - window.innerHeight));
    };
    measureGap();
    window.addEventListener('resize', measureGap);
    window.addEventListener('orientationchange', measureGap);
    return () => {
      window.removeEventListener('resize', measureGap);
      window.removeEventListener('orientationchange', measureGap);
    };
  }, []);

  return extraBottomGap;
};
