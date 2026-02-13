import { useState, useEffect } from 'react';
import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';
import { ActiveBot } from '@app/modules/Match/movex/types';
import { useMatchViewState } from '../../../modules/Match/hooks/useMatch';

const CAMERA_ENABLED_STORAGE_KEY = 'chessroulette-camera-enabled';

type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
  activeBot?: ActiveBot;
  isExpanded?: boolean;
  cameraOnAgain?: boolean;
  camera?: boolean;
  onDisableCamera?: () => void;
  onToggleExpand?: () => void;
};

export const PeerToPeerCameraWidget = ({
  aspectRatio = 16 / 9,
  activeBot,
  onToggleExpand,
  cameraOnAgain,
  camera,
  isExpanded,
  onDisableCamera,
}: Props) => {
  const peerStreaming = usePeerStreaming();
  const { match, userAsPlayer } = useMatchViewState();

  if (!userAsPlayer) {
    return null;
  }

  if (!config.CAMERA_ON || !!activeBot?.name) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={aspectRatio} h-full w-full>
        <DEV_CameraView
          className={`w-full h-full object-covers rounded-lg  overflow-hidden`}
          demoImgId={hashDemoImgId(peerStreaming.clientUserId) as any}
          bot={match?.challengee?.id}
          activeBotPic={activeBot?.picture}
        />
      </AspectRatio>
    );
  }
  return (
    <MultiFaceTimeCompact
      onToggleExpand={() => onToggleExpand?.()}
      cameraOnAgain={cameraOnAgain}
      cameraDisable={onDisableCamera}
      isExpanded={isExpanded}
      camera={camera}
      reel={peerStreaming.reel}
      aspectRatio={aspectRatio}
      onFocus={() => {
        // TBD
      }}
    />
  );
};
