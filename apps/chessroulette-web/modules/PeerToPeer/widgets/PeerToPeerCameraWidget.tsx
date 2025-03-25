import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';

type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
  isBotPlay: boolean;
};

export const PeerToPeerCameraWidget: React.FC<Props> = ({ aspectRatio = 16 / 9, isBotPlay }) =>  {
  const peerStreaming = usePeerStreaming();
 console.log("Bot Play Status:", isBotPlay);
  if (!config.CAMERA_ON) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={aspectRatio}>
        <DEV_CameraView
          className={`w-full h-full object-covers`}
          demoImgId={hashDemoImgId(peerStreaming.clientUserId) as any}
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
