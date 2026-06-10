'use client';

import { useEffect, useRef } from 'react';

type Props = {
  isMobile?: boolean;
};

export const GoogleAd = ({ isMobile }: Props) => {
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
        minWidth: isMobile ? '250px' : '330px',
        minHeight: isMobile ? '60px' : '90px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      data-ad-client="ca-pub-8003586277876347"
      data-ad-slot="2567012649"
      data-ad-format={isMobile ? 'horizontal' : 'auto'}
      data-full-width-responsive="true"
    />
  );
};
