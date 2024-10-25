'use client';

import { type DispatchOf, noop } from '@xmatter/util-kit';
import type { IceServerRecord } from '@app/providers/PeerToPeerProvider';
import type { UserId, UsersMap } from '@app/modules/User';
import type { MatchActivityActions, MatchActivityState } from './movex';
import { MatchContainer } from '@app/modules/Match';
import { useMatchActivitySettings } from './useMatchActivitySettings';
import { CameraPanel } from '../../components';
import { RIGHT_SIDE_SIZE_PX } from '../../CONSTANTS';
import { PanelResizeHandle } from 'react-resizable-panels';
import { useRoomLinkId } from '../../hooks';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: UsersMap;
  remoteState: NonNullable<MatchActivityState['activityState']>;
  dispatch?: DispatchOf<MatchActivityActions>;
};

export const MatchActivity = ({ remoteState, dispatch, ...props }: Props) => {
  const { joinRoomLink } = useRoomLinkId('match');
  // const { isBoardFlipped } = useMatchActivitySettings();

  return (
    <MatchContainer
      dispatch={dispatch || noop}
      match={remoteState}
      // isBoardFlipped={isBoardFlipped}
      inviteLink={joinRoomLink}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName="flex flex-col"
      rightSideComponent={
        <>
          <div className="flex-1" />
          <div className="relative flex flex-col items-center justify-center">
            <PanelResizeHandle
              className="w-1 h-20 rounded-lg bg-slate-600"
              title="Resize"
            />
          </div>
          <div className="flex-1" />
        </>
      }
      cameraComponent={
        <>
          {props.participants && props.participants[props.userId] && (
            <div className="overflow-hidden rounded-lg shadow-2xl">
              {/* This needs to show only when the user is a players
               * otherwise it's too soon and won't connect to the Peers
               */}
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
