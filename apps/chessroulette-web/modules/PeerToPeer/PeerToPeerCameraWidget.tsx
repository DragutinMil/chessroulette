import { useMemo } from 'react';
import { toDictIndexedBy } from '@xmatter/util-kit';
import { config } from '@app/config';
import { AspectRatio } from '@app/components/AspectRatio';
import { UserId, UsersMap } from '@app/modules/User/type';
import { IceServerRecord, PeerUsersMap } from './PeerToPeerProvider';
import { DEV_CameraView } from './components/DEV_CameraView';
import { FaceTimeProps } from './components';
import { MultiFaceTimeCompact } from './components/MultiFaceTimeCompact';
import { PeerStreamingContainer } from './PeerStreamingContainer';

type Props = {
  userId: UserId;
  peerGroupId: string;
  participants: UsersMap;
  iceServers: IceServerRecord[];
  aspectRatio?: FaceTimeProps['aspectRatio'];
  fallback?: React.ReactNode;
};

export const PeerToPeerCameraWidget = ({
  iceServers,
  aspectRatio,
  userId,
  peerGroupId,
  participants,
}: Props) => {
  const { [userId]: removedMe, ...peerUsersMap } = useMemo<PeerUsersMap>(
    () =>
      toDictIndexedBy(
        Object.values(participants),
        (p) => p.id,
        (p) => ({
          userId: p.id,
          userDisplayName: p.displayName,
        })
      ),
    [participants]
  );

  if (!config.CAMERA_ON) {
    const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
    return (
      <AspectRatio aspectRatio={aspectRatio}>
        <DEV_CameraView
          className={`w-full h-full object-covers`}
          demoImgId={hashDemoImgId(userId) as any}
        />
      </AspectRatio>
    );
  }

  return (
    <PeerStreamingContainer
      groupId={peerGroupId}
      clientUserId={userId}
      p2pCommunicationType="audioVideo"
      peerUsersMap={peerUsersMap}
      iceServers={iceServers}
      render={({ reel }) => (
        <MultiFaceTimeCompact
          reel={reel}
          aspectRatio={aspectRatio}
          onFocus={() => {
            // TBD
          }}
        />
      )}
    />
  );
};
