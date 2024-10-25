'use client';

import { type DispatchOf, noop } from '@xmatter/util-kit';
import type { IceServerRecord } from '@app/providers/PeerToPeerProvider';
import type { UserId, UsersMap } from '@app/modules/User';
import type { MatchActivityActions, MatchActivityState } from './movex';
import { MatchContainer } from '@app/modules/Match';
import { useMatchActivitySettings } from './useMatchActivitySettings';
import { CameraPanel } from '../../components';
import { RIGHT_SIDE_SIZE_PX } from '../../CONSTANTS';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: UsersMap;
  remoteState: NonNullable<MatchActivityState['activityState']>;
  dispatch?: DispatchOf<MatchActivityActions>;
};

export const MatchActivity = ({ remoteState, dispatch, ...props }: Props) => {
  const { isBoardFlipped } = useMatchActivitySettings();

  return (
    <MatchContainer
      dispatch={dispatch || noop}
      match={remoteState}
      isBoardFlipped={isBoardFlipped}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      cameraComponent={
        <>
          {props.participants && props.participants[props.userId] && (
            <div className="overflow-hidden rounded-lg shadow-2xl">
              {/* // This needs to show only when the user is a players //
                  otherwise it's too soon and won't connect to the Peers */}
              {/* // TODO: Provide this so I don't have to pass in the iceServers each time */}
              <CameraPanel
                participants={props.participants}
                userId={props.userId}
                peerGroupId={props.roomId}
                iceServers={props.iceServers}
                aspectRatio={16 / 9}
              />
            </div>
          )}
        </>
      }
      {...props}
    />
  );
};
