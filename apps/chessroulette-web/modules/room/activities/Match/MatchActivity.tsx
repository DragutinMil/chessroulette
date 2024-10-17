'use client';

import { DispatchOf, noop } from '@xmatter/util-kit';
import { IceServerRecord } from '@app/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from '@app/modules/user/type';
import { MatchActivityActions, MatchActivityState } from './movex';
import { MatchActivityView } from './MatchActivityView';
import { useMatchActivitySettings } from './useMatchActivitySettings';

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
    <MatchActivityView
      dispatch={dispatch || noop}
      state={remoteState}
      isBoardFlipped={isBoardFlipped}
      {...props}
    />
  );
};
