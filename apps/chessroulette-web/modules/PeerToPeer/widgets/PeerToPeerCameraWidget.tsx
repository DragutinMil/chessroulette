import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { FaceTimeProps, MultiFaceTimeCompact } from '../components';
import { DEV_CameraView } from '../components/DEV_CameraView';
import { usePeerStreaming } from '../PeerStreaming/hooks/usePeerStreaming';
import { activeBot } from '@app/modules/Match/movex/types';
import { useState, useEffect } from 'react';
import { useMatchViewState } from '../../../modules/Match/hooks/useMatch';
type Props = {
  aspectRatio?: FaceTimeProps['aspectRatio'];
  activeBot?: activeBot;
  isExpanded?: boolean;
  cameraVisible?:boolean;
  onDisableCamera?: () => void;
  onToggleExpand?: () => void;
};

export const PeerToPeerCameraWidget = ({
  aspectRatio = 16 / 9,
  activeBot,
  onToggleExpand,
  isExpanded,
  onDisableCamera,
  cameraVisible,
}: Props) => {
  const peerStreaming = usePeerStreaming();

  const { match, ...matchView } = useMatchViewState();

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
      cameraDisable={onDisableCamera}
      isExpanded={isExpanded}
      cameraVisible={cameraVisible}
      reel={peerStreaming.reel}
      aspectRatio={aspectRatio}
      onFocus={() => {
        // TBD
      }}
    />
  );
};
