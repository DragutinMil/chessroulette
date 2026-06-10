'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  isMobile?: boolean;
};

export const GoogleAd = ({ isMobile }: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>('loading');

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

    const mutationObserver = new MutationObserver(() => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'filled' || status === 'unfilled') {
        setAdStatus(status);
        mutationObserver.disconnect();
      }
    });
    mutationObserver.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

    const pushAd = () => {
      tryPush();
      // fallback: if no status change after 4s, hide loader
      setTimeout(() => {
        setAdStatus((prev) => (prev === 'loading' ? 'unfilled' : prev));
      }, 4000);
    };

    if (el.offsetWidth > 0) {
      pushAd();
      return () => mutationObserver.disconnect();
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          resizeObserver.disconnect();
          pushAd();
          return;
        }
      }
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  if (adStatus === 'unfilled') return null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {adStatus === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '8px',
            minHeight: isMobile ? '110px' : '135px',
            background: 'linear-gradient(90deg, #0a2a14 25%, #0f3d1e 50%, #0a2a14 75%)',
            backgroundSize: '200% 100%',
            animation: 'adSkeleton 1.4s infinite',
            zIndex: 1,
          }}
        />
      )}
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{
          display: 'block',
          minWidth: isMobile ? '250px' : '330px',
          minHeight: isMobile ? '110px' : '135px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-ad-client="ca-pub-8003586277876347"
        data-ad-slot="3329429976"
      />
      <style>{`
        @keyframes adSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
