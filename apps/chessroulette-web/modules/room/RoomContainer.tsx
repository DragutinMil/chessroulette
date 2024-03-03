'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier, toResourceIdentifierObj } from 'movex-core-util';
import { MovexBoundResource, useMovexBoundResourceFromRid } from 'movex-react';
import { useUserId } from 'apps/chessroulette-web/hooks/useUserId/useUserId';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { ActivityState } from './activities/movex';
import { LearnActivity } from './activities/Learn';
import { initialLearnActivityState } from './activities/Learn/movex';
import { MeetupActivity } from './activities/Meetup/MeetupActivity';
import { initialMeetupActivityState } from './activities/Meetup/movex';

type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
  activity: ActivityState['activityType'];
};

export const RoomContainer = ({ iceServers, rid, activity }: Props) => {
  const userId = useUserId();
  const movexResource = useMovexBoundResourceFromRid(movexConfig, rid);

  return (
    <>
      {/* TODO: remove this in favor of the hook once I figure out how to call onComponentWillUnmount */}
      <MovexBoundResource
        movexDefinition={movexConfig}
        rid={rid}
        onReady={({ boundResource }) => {
          boundResource.dispatch({
            type: 'join',
            payload: { userId },
          });
        }}
        onComponentWillUnmount={(s) => {
          if (s.init) {
            s.boundResource.dispatch({
              type: 'leave',
              payload: { userId },
            });
          }
        }}
        render={() => null}
      />
      {
        {
          learn: (
            <LearnActivity
              userId={userId}
              roomId={toResourceIdentifierObj(rid).resourceId}
              dispatch={movexResource?.dispatch}
              participants={movexResource?.state.participants || {}}
              iceServers={iceServers}
              remoteState={
                movexResource?.state.activity.activityType === 'learn'
                  ? movexResource?.state.activity.activityState ??
                    initialLearnActivityState.activityState
                  : initialLearnActivityState.activityState
              }
            />
          ),
          meetup: (
            <MeetupActivity
              userId={userId}
              roomId={toResourceIdentifierObj(rid).resourceId}
              dispatch={movexResource?.dispatch}
              participants={movexResource?.state.participants || {}}
              iceServers={iceServers}
              remoteState={
                movexResource?.state.activity.activityType === 'meetup'
                  ? movexResource?.state.activity.activityState ??
                    initialMeetupActivityState.activityState
                  : initialMeetupActivityState.activityState
              }
            />
          ),

          // TODO add as we move forward
          play: null,
          none: null,
        }[activity]
      }
    </>
  );
};
