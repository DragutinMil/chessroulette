import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { PlayContainer_old } from '../../../Play/PlayContainer_old';
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

  return (
    <PlayContainer_old
      state={remoteState}
      dispatch={dispatch}
      isBoardFlipped={isBoardFlipped}

      // TODO: The players here aren't the participants (this is not correct. the players should and will come from the game! or match!)
      //  In fact I don't even know why this is used?
      // Should be removd
      players={participants}
      {...props}
    />
  );
};
