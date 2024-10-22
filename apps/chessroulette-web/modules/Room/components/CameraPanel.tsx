import { toDictIndexedBy } from '@xmatter/util-kit';
import { AspectRatio } from '@app/components/AspectRatio';
import { CameraView } from '@app/components/CameraView';
import { FaceTimeProps } from '@app/components/FaceTime';
import { MultiFaceTimeCompact } from '@app/components/FaceTime/MultiFaceTimeCompact';
import { config } from '@app/config';
import { PeerStreamingGroup } from '@app/modules/PeerStreaming';
import { UserId, UsersMap } from '@app/modules/User/type';
import {
  IceServerRecord,
  PeerUsersMap,
} from '@app/providers/PeerToPeerProvider/type';
import { useMemo } from 'react';

type Props = {
  userId: UserId;
  peerGroupId: string;
  participants: UsersMap;
  iceServers: IceServerRecord[];
  aspectRatio?: FaceTimeProps['aspectRatio'];
  fallback?: React.ReactNode;
};

export const CameraPanel = ({
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
    return (
      <AspectRatio aspectRatio={aspectRatio}>
        <CameraView
          className={`w-full h-full object-covers`}
          demoImgId={hashDemoImgId(userId) as any}
        />
      </AspectRatio>
    );
  }

  return (
    <PeerStreamingGroup
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

const hashDemoImgId = (id: string) => Number(id.match(/\d/)?.[0] || 0);
