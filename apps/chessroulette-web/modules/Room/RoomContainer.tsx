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
import { LearnAiActivity } from './activities/LearnAi/LearnAiActivity';

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
    ch_amount?: string;
    initiator_name_first?: string;
    initiator_name_last?: string;
  } | null>(null);

  // Jednostavan useEffect samo za socket i notifikacije
  useEffect(() => {
    // console.log('🔌 Connecting to socket... room');

    // Poveži se na socket sa statusom 'available'

    const handleChallengeNotification = (data: any) => {
      const isChallengeNotification =
        data.n_type === 'challenge_initiated' ||
        data.ch_uuid ||
        data.challenge_uuid ||
        data.ch_target_uuid ||
        data.data?.ch_uuid;

      if (isChallengeNotification) {
        const firstName =
          data.from_user_object?.name_first ||
          data.initiator_name_first ||
          data.initiator?.name_first ||
          data.challenger?.name_first;

        const lastName =
          data.from_user_object?.name_last ||
          data.initiator_name_last ||
          data.initiator?.name_last ||
          data.challenger?.name_last;

        // Izvuci ch_uuid iz različitih izvora

        const chUuid =
          data.data?.ch_uuid || data.ch_uuid || data.challenge_uuid;

        console.log('🔍 Extracted chUuid:', chUuid);

        if (!chUuid) {
          console.error('❌ ERROR: No ch_uuid found in notification data!');
          console.error('❌ Available keys:', Object.keys(data));
          if (data.data) {
            console.error('❌ data.data keys:', Object.keys(data.data));
          }
          return; // Ne postavljaj notifikaciju ako nema ch_uuid
        }

        // Izvuci time_control iz data.data objekta

        const timeControl =
          data.data?.ch_type || data.time_control || data.timeControl;

        // Izvuci amount iz data.data objekta
        const amount = data.data?.ch_amount || data.ch_amount;

        const challengeData = {
          ch_uuid: chUuid,
          challenger_name:
            data.from_user_object?.name_first &&
            data.from_user_object?.name_last
              ? `${data.from_user_object.name_first} ${data.from_user_object.name_last}`
              : data.challenger_name || data.challenger?.name,
          challenger_id:
            data.from_user_uuid || data.challenger_id || data.challenger?.id,
          time_class:
            data.time_class || data.timeClass || data.data?.time_class,
          time_control: timeControl,

          ch_amount: amount,

          initiator_name_first: firstName,
          initiator_name_last: lastName,
        };

        setChallengeNotification(challengeData);
      }
      //  else {
      //console.log('⚠️ Not a challenge notification, ignoring...');
      // }
    };

    // Pretplati se na notifikacije
    // console.log('📡 Subscribing to tb_notification...');
    socketUtil.subscribe('tb_notification', handleChallengeNotification);

    // Cleanup
    return () => {
      // console.log('🧹 Cleaning up socket subscription...');
      socketUtil.unsubscribe('tb_notification', handleChallengeNotification);
    };
  }, []);

  // useEffect(() => {
  //   console.log(
  //     '📬 challengeNotification state changed:',
  //     challengeNotification
  //   );
  // }, [challengeNotification]);

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
    if (activity.activityType === 'ailearn') {
      return (
        <LearnAiActivity
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
      <div className="flex-center">
        <ChallengeNotification
          challenge={challengeNotification}
          onAccept={(challengeUuid) => {
            setChallengeNotification(null);
          }}
          onDecline={() => {
            setChallengeNotification(null);
          }}
        />
      </div>
    </PeerStreamingProvider>
  );
};
