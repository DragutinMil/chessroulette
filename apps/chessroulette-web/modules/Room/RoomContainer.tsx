'use client';

import { useMemo } from 'react';
import {
  ResourceIdentifier,
  toResourceIdentifierObj,
  toResourceIdentifierStr,
} from 'movex-core-util';
import {
  useMovex,
  useMovexBoundResourceFromRid,
  useMovexClient,
} from 'movex-react';
import movexConfig from '@app/movex.config';
import {
  IceServerRecord,
  PeerUsersMap,
} from '@app/modules/PeerToPeer/providers/PeerToPeerProvider';
import { invoke, toDictIndexedBy } from '@xmatter/util-kit';
import { Modal } from '@app/components/Modal';
import { movexSubcribersToUserMap } from '@app/providers/MovexProvider';
import { PeerStreamingProvider } from '@app/modules/PeerToPeer';
import { ActivityState } from './activities/movex';
import { LearnActivity } from './activities/Learn';
import { AichessActivity } from './activities/Aichess/AichessActivity';
import { MeetupActivity } from './activities/Meetup/MeetupActivity';
import { MatchActivity } from './activities/Match/MatchActivity';
import { useSearchParams } from 'next/navigation';
type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
  activity: ActivityState['activityType'];
};

export const RoomContainer = ({ iceServers, rid }: Props) => {
  const movex = useMovex(movexConfig);
  const movexResource = useMovexBoundResourceFromRid(movexConfig, rid);
  const userId = useMovexClient(movexConfig)?.id;
  const participants = useMemo(
    () => movexSubcribersToUserMap(movexResource?.subscribers || {}),
    [movexResource?.subscribers]
  );
  // const params = useSearchParams();
  // const tokenParam = params.get('sessionToken');
  // console.log('tokenParam',tokenParam)
  const peerUsersMap = useMemo<PeerUsersMap>(() => {
    const allPeers = toDictIndexedBy(
      Object.values(participants),
      (p) => p.id,
      (p) => ({
        userId: p.id,
        userDisplayName: p.displayName,
      })
    );

    if (!userId) {
      return allPeers;
    }

    const { [userId]: removedMe, ...restOfPeers } = allPeers;

    return restOfPeers;
  }, [userId, participants]);

  const activityRender = invoke(() => {
    // This shouldn't really happen
    if (!userId) {
      // TODO: show an invalid page
      return null;
    }

    if (!movexResource) {
      // TODO: This shows nothing on the server render but it could show an empty default page with activity none?
      // Or show a suspense or something,
      // But just for Server Renndering I shouldn't make it much harder on the Activity side to work with dispatch and other things
      return null;
    }
    const { activity } = movexResource.state;
    const commonActivityProps = {
      userId,
      roomId: toResourceIdentifierObj(rid).resourceId,
      dispatch: movexResource.dispatch,
      participants,
      iceServers,
    } as const;

    if (activity.activityType === 'learn') {
      return (
        <LearnActivity
          {...commonActivityProps}
          remoteState={activity.activityState}
          dispatch={movexResource?.dispatch}
        />
      );
    }
    if (activity.activityType === 'aichess') {
      return (
        <AichessActivity
          {...commonActivityProps}
          remoteState={activity.activityState}
          dispatch={movexResource?.dispatch}
        />
      );
    }


    if (activity.activityType === 'meetup') {
      return (
        <MeetupActivity
          {...commonActivityProps}
          remoteState={activity.activityState}
        />
      );
    }

    if (activity.activityType === 'match' && activity.activityState) {
      return (
        <MatchActivity
          {...commonActivityProps}
          remoteState={activity.activityState}
        />
      );
    }

    return null;
  });

  if (!userId) {
    // TODO: show an invalid page
    return null;
  }

  return (
    <PeerStreamingProvider
      groupId={toResourceIdentifierStr(rid)}
      clientUserId={userId}
      iceServers={iceServers}
      peerUsersMap={peerUsersMap}
    >
      {activityRender}
      {movex.status === 'disconnected' && (
        <Modal>You got disconnected. Refresh the page!</Modal>
      )}
      {movex.status === 'connectionError' && (
        <Modal>Cannot connect. Check your Internet Connection!</Modal>
      )}
    </PeerStreamingProvider>
  );
};
