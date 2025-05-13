'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
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
  isBot?: Boolean;
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
  isBot,
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
  const [botImg, setBotImg] = useState('');
  useEffect(() => {
    if (bot) {
      if (bot.slice(-2) == '10') {
        // 2000
        setBotImg(
          'https://outpostchess.fra1.digitaloceanspaces.com/4e5cf95f-e232-45cb-9c09-74354791db10.png'
        );
        //setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/d78b2793-b5de-4a12-8fb0-1d2664fdd10e.png')
      } else if (bot.slice(-2) == '08') {
        //1800
        setBotImg(
          'https://outpostchess.fra1.digitaloceanspaces.com/805cf0d7-e73f-4135-9837-733b31fa3e49.png'
        );
      } else if (bot.slice(-2) == '05') {
        //1500
        setBotImg(
          'https://outpostchess.fra1.digitaloceanspaces.com/fa245412-a7e2-4d29-b9d6-34f471df8d08.png'
        );
        // setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/8dd58f5c-a7ab-4be4-a906-c0bdcd6dcc49.png')
      } else if (bot.slice(-2) == '02') {
        //1200
        setBotImg(
          'https://outpostchess.fra1.digitaloceanspaces.com/96124b0e-0775-48e2-8017-59904373276f.png'
        );
        //  setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/a683cf73-0f66-4f61-97a7-b6d5e626b041.png')
      } else if (bot.slice(-2) == '20') {
        //800
        setBotImg(
          'https://outpostchess.fra1.digitaloceanspaces.com/1cbac9bd-fd34-4931-9a08-32f6487afc2d.png'
        );
        //setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/38d1e510-df66-4054-a42f-ddde6968e90f.png')
      }
    }
    onReady?.();
  }, []);

  return (
    <div className={className}>
      {isBot ? (
        <div
          className={className}
          style={{
            ...style,
            backgroundImage: `url(${botImg})`,
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
