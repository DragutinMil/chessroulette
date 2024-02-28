'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import {
  ResourceIdentifier,
  objectKeys,
  toResourceIdentifierStr,
} from 'movex-core-util';
import { MovexBoundResource } from 'movex-react';
import { useMemo, useState } from 'react';
import { useUserId } from 'apps/chessroulette-web/hooks/useUserId/useUserId';
import { PeerStreamingGroup } from '../PeerStreaming';
import { MultiFaceTimeCompact } from 'apps/chessroulette-web/components/FaceTime/MultiFaceTimeCompact';
import {
  IceServerRecord,
  PeerUserIdsMap,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { config } from 'apps/chessroulette-web/config';
import { CameraView } from 'apps/chessroulette-web/components/CameraView';
import { AspectRatio } from 'apps/chessroulette-web/components/AspectRatio';
import { FaceTimeProps } from 'apps/chessroulette-web/components/FaceTime';
import { UserId } from '../user/type';

type Props = {
  rid: ResourceIdentifier<'room'>;
  aspectRatio?: FaceTimeProps['aspectRatio'];
  iceServers: IceServerRecord[];
  userId: UserId;
  fallback?: React.ReactNode;
};

const hashDemoImgId = (id: string) => {
  return Number(id.match(/\d/)?.[0] || 0);
};

export default ({ rid, aspectRatio, iceServers, userId }: Props) => {
  // const userId = useUserId();
  const peerUser = useMemo(() => {
    if (userId) {
      return {
        id: userId,
      };
    }

    return undefined;
  }, [userId]);

  const [camerasReady, setCamerasReady] = useState(false);

  const ridAsStr = useMemo(() => toResourceIdentifierStr(rid), [rid]);

  // console.log('render streaming');

  if (!peerUser) {
    return (
      <div>No user id present. For now it needs to be given in the url</div>
    );
  }

  return (
    <MovexBoundResource
      movexDefinition={movexConfig}
      rid={rid}
      render={({ boundResource: { state } }) => {
        const { [userId]: removedMe, ...peerUserIdsMap } = objectKeys(
          state.participants
        ).reduce(
          (prev, nextUserId) => ({
            ...prev,
            [nextUserId]: nextUserId,
          }),
          {} as PeerUserIdsMap
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
            groupId={ridAsStr}
            clientUserId={peerUser.id}
            p2pCommunicationType="audioVideo"
            peerUserIdsMap={peerUserIdsMap}
            iceServers={iceServers}
            render={({ reel }) => (
              <MultiFaceTimeCompact
                reel={reel}
                aspectRatio={aspectRatio}
                onFocus={() => {
                  console.log('on focus');
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
      }}
    />
  );
};
