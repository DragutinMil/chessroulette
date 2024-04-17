'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier, toResourceIdentifierObj } from 'movex-core-util';
import { useMovexBoundResourceFromRid, useMovexClientId } from 'movex-react';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { ActivityState } from './activities/movex';
import { LearnActivity } from './activities/Learn';
import { initialLearnActivityState } from './activities/Learn/movex';
import { MeetupActivity } from './activities/Meetup/MeetupActivity';
import { initialMeetupActivityState } from './activities/Meetup/movex';
import { useMemo } from 'react';
import { objectKeys } from '@xmatter/util-kit';
import { UsersMap } from '../user/type';
import { MovexClientInfo } from 'apps/chessroulette-web/providers/MovexProvider';

type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
  activity: ActivityState['activityType'];
};

export const RoomContainer = ({ iceServers, rid, activity }: Props) => {
  const movexResource = useMovexBoundResourceFromRid(movexConfig, rid);
  const userId = useMovexClientId(movexConfig);
  const participants = useMemo(() => {
    if (!movexResource) {
      return {};
    }

    return objectKeys(movexResource.subscribers).reduce(
      (prev, nextSubscriberId) => ({
        ...prev,
        [nextSubscriberId]: {
          id: nextSubscriberId,
          displayName: (
            movexResource.subscribers[nextSubscriberId].info as MovexClientInfo
          ).displayName,
        },
      }),
      {} as UsersMap
    );
  }, [movexResource?.subscribers]);

  // This shouldn't really happen
  if (!userId) {
    return null;
  }

  if (activity === 'learn') {
    return (
      <LearnActivity
        userId={userId}
        roomId={toResourceIdentifierObj(rid).resourceId}
        dispatch={movexResource?.dispatch}
        participants={participants}
        iceServers={iceServers}
        remoteState={
          movexResource?.state.activity.activityType === 'learn'
            ? movexResource?.state.activity.activityState ??
              initialLearnActivityState.activityState
            : initialLearnActivityState.activityState
        }
      />
    );
  }

  if (activity === 'meetup') {
    return (
      <MeetupActivity
        userId={userId}
        roomId={toResourceIdentifierObj(rid).resourceId}
        dispatch={movexResource?.dispatch}
        participants={participants}
        iceServers={iceServers}
        remoteState={
          movexResource?.state.activity.activityType === 'meetup'
            ? movexResource?.state.activity.activityState ??
              initialMeetupActivityState.activityState
            : initialMeetupActivityState.activityState
        }
      />
    );
  }

  return null;
};
