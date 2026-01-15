'use client';

import { CSSProperties, useMemo } from 'react';
import { getRandomInt } from '@app/util';
import demo1 from './assets/1.jpg';
import demo2 from './assets/2.jpg';
import demo3 from './assets/3.jpg';
import demo4 from './assets/4.jpg';

export type Props = {
  style?: CSSProperties;
  className?: string;
  demoImgId?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  onReady?: () => void;
  bot?: string;
  activeBotPic?: string;
};

/**
 * This must only be used in Dev mode!
 *
 * @param props
 * @returns
 */
export const DEV_CameraView = ({
  demoImgId,
  className,
  style,
  onReady,
  bot,
  activeBotPic,
}: Props) => {
  const imgSrc = useMemo(() => {
    const DemoImgs = [
      demo1,
      demo2,
      demo3,
      demo4,
      demo1,
      demo2,
      demo3,
      demo4,
      demo1,
      demo2,
    ];

    return DemoImgs[
      demoImgId === undefined ? getRandomInt(0, DemoImgs.length - 1) : demoImgId
    ];
  }, [demoImgId]);
 
  return (
    <div className="w-full h-full">
      {activeBotPic && activeBotPic?.length > 0 ? (
        // h-[320px] max-[1400px]:h-[260px]
        <div
          className={`${className}`}
          style={{
            ...style,
            backgroundImage: `url(${activeBotPic})`,
            backgroundSize: 'cover',
          }}
        ></div>
      ) : (
        <div
          className={className}
          style={{
            ...style,
            backgroundImage: `url(${imgSrc.src})`,
            backgroundSize: 'cover',
          }}
        ></div>
      )}
    </div>
  );
};
