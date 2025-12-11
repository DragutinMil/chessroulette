import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';
import { useState, useEffect } from 'react';
import { useMatchViewState } from '../../../modules/Match/hooks/useMatch';
type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
};

export const PeerToPeerCameraWidget = ({ aspectRatio = 16 / 9 }: Props) => {
  const peerStreaming = usePeerStreaming();
  const { match, ...matchView } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
  useEffect(() => {
    if (match) {
      if (match?.challengee?.id.length == 16) {
        setBots(true);
        // console.log('length', match?.challengee?.id.length);
      }
      //  setBots( ['8WCVE7ljCQJTW020','NaNuXa7Ew8Kac002','O8kiLgwcKJWy9005','KdydnDHbBU1JY008','vpHH6Jf7rYKwN010','ruuPkmgP0KBei015'].indexOf(match?.challengee?.id)!==-1 )
    }
  }, []);
  if (!config.CAMERA_ON || isBotPlay) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={aspectRatio}>
        <DEV_CameraView
          className={`w-full h-full object-covers`}
          demoImgId={hashDemoImgId(peerStreaming.clientUserId) as any}
          bot={match?.challengee?.id}
          isBot={isBotPlay}
        />
      </AspectRatio>
    );
  }

  return (
    <MultiFaceTimeCompact
      reel={peerStreaming.reel}
      aspectRatio={aspectRatio}
      onFocus={() => {
        // TBD
      }}
    />
  );
};