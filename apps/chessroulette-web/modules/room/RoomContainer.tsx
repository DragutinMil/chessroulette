'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier, toResourceIdentifierObj } from 'movex-core-util';
import { useMovexBoundResourceFromRid, useMovexClientId } from 'movex-react';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { ActivityState } from './activities/movex';
import { LearnActivity } from './activities/Learn';
import { MeetupActivity } from './activities/Meetup/MeetupActivity';
import { useMemo } from 'react';
import { PlayActivity } from './activities/Play/PlayActivity';
import { MatchActivity } from './activities/Match/MatchActivity';
import { movexSubcribersToUserMap } from 'apps/chessroulette-web/providers/MovexProvider';

type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
  activity: ActivityState['activityType'];
};

export const RoomContainer = ({ iceServers, rid }: Props) => {
  const movexResource = useMovexBoundResourceFromRid(movexConfig, rid);
  const userId = useMovexClientId(movexConfig);
  const participants = useMemo(
    () => movexSubcribersToUserMap(movexResource?.subscribers || {}),
    [movexResource?.subscribers]
  );

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
        userId={userId}
        roomId={toResourceIdentifierObj(rid).resourceId}
        dispatch={movexResource?.dispatch}
        participants={participants}
        iceServers={iceServers}
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

  if (activity.activityType === 'play') {
    return (
      <PlayActivity
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
};
