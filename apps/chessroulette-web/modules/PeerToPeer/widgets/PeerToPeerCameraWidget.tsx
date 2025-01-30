import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';

type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
};

export const PeerToPeerCameraWidget = ({ aspectRatio = 16 / 9 }: Props) => {
  const peerStreaming = usePeerStreaming();
  const isMobile = window.innerWidth <= 768;
  if (!config.CAMERA_ON) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={isMobile? 12/8 : 16/9 }>
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
