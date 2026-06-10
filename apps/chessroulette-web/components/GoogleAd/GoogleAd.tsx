'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  isMobile?: boolean;
};

export const GoogleAd = ({ isMobile }: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>(
    'loading'
  );

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
    <div >
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{
          display: 'block',
          minWidth: isMobile ? '270px' : '330px',
          maxWidth: isMobile ? '330px' : '400px' ,
          minHeight: isMobile ? '80px' : '100px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-ad-client="ca-pub-8003586277876347"
        data-ad-slot="3329429976"
        data-full-width-responsive="true"
      />
     
    </div>
  );
};
