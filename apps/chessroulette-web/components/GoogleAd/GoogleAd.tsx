'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  isMobile?: boolean;
};

// Fixed IAB sizes instead of "auto" responsive — much higher advertiser demand/fill.
const AD_WIDTH = { mobile: 320, desktop: 300 };
const AD_HEIGHT = { mobile: 100, desktop: 250 };
const AD_SLOT = { mobile: '4325815827', desktop: '4493336789' };

export const GoogleAd = ({ isMobile }: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>(
    'loading'
  );
  const width = isMobile ? AD_WIDTH.mobile : AD_WIDTH.desktop;
  const height = isMobile ? AD_HEIGHT.mobile : AD_HEIGHT.desktop;
  const adSlot = isMobile ? AD_SLOT.mobile : AD_SLOT.desktop;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tryPush = () => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
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
    mutationObserver.observe(el, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

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

  // if (adStatus === 'unfilled') return null;

  return (
    <div style={{ position: 'relative', width, height }}>
      {adStatus === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '8px',
            background:
              'linear-gradient(90deg, #1f1f1f 25%, #323232 50%, #1f1f1f 75%)',
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
          display: 'inline-block',
          width,
          height,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        data-ad-client="ca-pub-8003586277876347"
        data-ad-slot={adSlot}
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
