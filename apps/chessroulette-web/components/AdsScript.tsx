'use client';

import { useEffect } from 'react';

// Reads is-eea cookie (set by middleware) and injects the ads script client-side,
// keeping the layout free of dynamic server functions so it can stay static.
export function AdsScript() {
  useEffect(() => {
    const isEEA = document.cookie.includes('is-eea=true');
    if (isEEA) return;

    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8003586277876347';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, []);

  return null;
}
