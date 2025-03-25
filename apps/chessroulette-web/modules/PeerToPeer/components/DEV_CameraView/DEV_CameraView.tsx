'use client';

import { CSSProperties, useEffect, useMemo,useState } from 'react';
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
  isBot?:Boolean;
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
  isBot
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
  const[botImg, setBotImg] = useState('')
  useEffect(() => {
    if(bot){
      if(bot.slice(-2) == '10'){
        setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/d78b2793-b5de-4a12-8fb0-1d2664fdd10e.png')
      }
      else if(bot.slice(-2) == '08'){
       
        setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/504ccae9-8f9c-4860-a19f-f6692dca10b2.png')
      }
      else if(bot.slice(-2) == '05'){
        setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/8dd58f5c-a7ab-4be4-a906-c0bdcd6dcc49.png')
      }
      else if(bot.slice(-2) == '02'){
      
        setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/a683cf73-0f66-4f61-97a7-b6d5e626b041.png')
      }
      else if(bot.slice(-2) == '20'){
        setBotImg('https://outpostchess.fra1.digitaloceanspaces.com/38d1e510-df66-4054-a42f-ddde6968e90f.png')
      }
      
     }
    onReady?.();
  }, []);

  
    
  
  return (
    <div className={className}>

{isBot? (
 <div
 className={className}
 style={{
   ...style,
   backgroundImage: `url(${botImg})`,
   backgroundSize: 'cover',
 }}
></div>
  ):(
 <div
      className={className}
      style={{
        ...style,
        backgroundImage: `url(${imgSrc.src})`,
        backgroundSize: 'cover',
      }}
    >
      </div>
  )}

    </div>
    
   
  );
};
