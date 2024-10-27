import { MovexBoundResourceFromConfig } from 'movex-react';
import movexConfig from '@app/movex.config';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from '@app/modules/PeerToPeer/PeerToPeerProvider';
import { UserId, UsersMap } from '@app/modules/User';
import { usePlayActivitySettings } from './usePlayActivitySettings';
import { PlayActivityState } from './movex';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: UsersMap;
  remoteState: PlayActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const PlayActivity = ({
  remoteState,
  dispatch: optionalDispatch,
  participants,
  ...props
}: Props) => {
  const { isBoardFlipped } = usePlayActivitySettings();

  // TODO: Why would this be optional here? Could be outside!
  const dispatch = optionalDispatch || noop;

  return null;
  // <PlayContainer_old
  //   state={remoteState}
  //   dispatch={dispatch}
  //   isBoardFlipped={isBoardFlipped}
  //   // TODO: The players here aren't the participants (this is not correct. the players should and will come from the game! or match!)
  //   //  In fact I don't even know why this is used?
  //   // Should be removd
  //   players={participants}
  //   {...props}
  // />
};
