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
import { ChallengeNotification } from '@app/components/ChallengeNotification/ChallengeNotification';
import socketUtil from '../../socketUtil';
import { useState, useEffect } from 'react';


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

  const [challengeNotification, setChallengeNotification] = useState<{
    ch_uuid: string;
    challenger_name?: string;
    challenger_id?: string;
    time_class?: string;
    time_control?: string;
    amount?: string;
  } | null>(null);

  // Dodajemo state za aktivnost
  const activityType = movexResource?.state?.activity?.activityType;

  useEffect(() => {
    // Određujemo status na osnovu aktivnosti
    let socketStatus: 'available' | 'playing' | 'watching' | 'reviewing' = 'reviewing';
    
    if (activityType === 'match') {
      socketStatus = 'playing';
    } else if (activityType === 'meetup') {
      socketStatus = 'watching';
    } else {
      socketStatus = 'reviewing';
    }

    // Poveži se na socket sa odgovarajućim statusom
    socketUtil.connect(socketStatus);

  const handleChallengeNotification = (data: any) => {
    console.log('Challenge notification received:', data);
    
    // Filtrirati samo challenge notifikacije (ne sve notifikacije)
    // Proverite da li je ovo challenge notifikacija na osnovu strukture podataka
    // Na primer, ako ima ch_uuid ili challenge_uuid, onda je challenge
    if (!data.ch_uuid && !data.challenge_uuid) {
      console.log('Not a challenge notification, ignoring...');
      return;
    }

    // Proverite da li je notifikacija za ovog korisnika
    // (ako challengee_id postoji i ne odgovara userId, ignorišite)
    if (data.challengee_id && userId && data.challengee_id !== userId) {
      console.log('Challenge notification not for this user, ignoring...');
      return;
    }

    setChallengeNotification({
      ch_uuid: data.ch_uuid || data.challenge_uuid,
      challenger_name: data.challenger_name || data.challenger?.name,
      challenger_id: data.challenger_id || data.challenger?.id,
      time_class: data.time_class || data.timeClass,
      time_control: data.time_control || data.timeControl, // Format kao "3+2"
      amount: data.amount || data.prize, // Format kao "€1"
    });
  };

    socketUtil.subscribe('tb_notification', handleChallengeNotification);

    return () => {
      socketUtil.unsubscribe('tb_notification', handleChallengeNotification);
      // Ne disconnect-ujemo socket ovde jer možda se aktivnost menja
      // Socket će se ažurirati sa novim statusom pri sledećoj promeni aktivnosti
    };
  }, [activityType]);

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
      
      <ChallengeNotification
        challenge={challengeNotification}
        onAccept={(challengeUuid) => {
          setChallengeNotification(null);
        }}
        onDecline={() => {
          setChallengeNotification(null);
        }}
      />
    </PeerStreamingProvider>
  );
};
