'use client';

import { DispatchOf, noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { MatchActivityActions, MatchActivityState } from './movex';
import { MatchActivityView } from './MatchActivityView';
import { useMatchActivitySettings } from './hooks/useMatchActivitySettings';
import { useEffect, useRef } from 'react';

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

  // const prev = useRef(remoteState);
  // useEffect(() => {
  //   console.group('remoteState updated', remoteState);
  //   console.log('ongoing game ', remoteState.ongoingPlay?.game);
  //   // console.log('diff', )
  //   console.groupEnd();
  // }, [remoteState]);

  return (
    <MatchActivityView
      dispatch={dispatch || noop}
      state={remoteState}
      isBoardFlipped={isBoardFlipped}
      {...props}
    />
  );
};
