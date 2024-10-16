import { toDictIndexedBy } from '@xmatter/util-kit';
import { AspectRatio } from '@app/components/AspectRatio';
import { CameraView } from '@app/components/CameraView';
import { FaceTimeProps } from '@app/components/FaceTime';
import { MultiFaceTimeCompact } from '@app/components/FaceTime/MultiFaceTimeCompact';
import { config } from '@app/config';
import { PeerStreamingGroup } from '@app/modules/PeerStreaming';
import { UserId, UsersMap } from '@app/modules/user/type';
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

const hashDemoImgId = (id: string) => {
  return Number(id.match(/\d/)?.[0] || 0);
};

export const CameraPanel = ({
  iceServers,
  aspectRatio,
  userId,
  peerGroupId,
  participants,
  fallback,
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
        //TOOD - don't know which is the right code here!
        // objectKeys(participants).reduce(
        //   (prev, nextUserId) => ({
        //     ...prev,
        //     [nextUserId]: nextUserId,
        //   }),
        //   {} as PeerUserIdsMap
        // objectKeys(players).reduce(
        //   (prev, nextUserId) => ({
        //     ...prev,
        //     [nextUserId]: nextUserId,
        //   }),
        //   {} as PeerUserIdsMap
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
            // console.log('on focus');
          }}

          // onReady={() => setCamerasReady(true)}
          // {...(camerasReady && {
          //   mainOverlay: () => (

          //   ),
          // })}
        />
      )}
    />
  );
};
