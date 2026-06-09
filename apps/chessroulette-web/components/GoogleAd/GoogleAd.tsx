'use client';

import { useEffect, useRef } from 'react';

export const GoogleAd = () => {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tryPush = () => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error('Adsense error', e);
      }
    };

    if (el.offsetWidth > 0) {
      tryPush();
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          observer.disconnect();
          tryPush();
          return;
        }
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{
        display: 'block',
        minWidth: '250px',
        minHeight: '60px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      data-ad-client="ca-pub-8003586277876347"
      data-ad-slot="2567012649"
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  );
};
