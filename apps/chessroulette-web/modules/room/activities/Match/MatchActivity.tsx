'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { MatchActivityState } from './movex';
import { usePlayActivitySettings } from '../Play/usePlayActivitySettings';
import { MatchActivityView } from './MatchActivityView';
import { useMemo } from 'react';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  players?: UsersMap;
  remoteState: MatchActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

// TODO: This is the one that can be used inside the Play

export const MatchActivity = ({
  remoteState,
  dispatch: optionalDispatch,
  ...props
}: Props) => {
  const { isBoardFlipped } = usePlayActivitySettings();

  // TODO: Why would this be optional here? Could be outside!
  // const dispatch = useMemo(() => optionalDispatch || noop, [optionalDispatch]);
  // const dispatch = useMemo(() => , [optionalDispatch]);

  return (
    <MatchActivityView
      dispatch={optionalDispatch || noop}
      state={remoteState}
      isBoardFlipped={isBoardFlipped}
      {...props}
    />
  );

  // return (
  //   <PlayContainer
  //     state={remoteState}
  //     dispatch={dispatch}
  //     isBoardFlipped={isBoardFlipped}
  //     {...props}
  //   />
  // );
};
