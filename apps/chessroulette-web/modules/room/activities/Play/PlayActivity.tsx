import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { PlayContainer } from '../../../Play/PlayContainer';
import { usePlayActivitySettings } from './usePlayActivitySettings';
import { PlayActivityState } from './movex';

export type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  players?: UsersMap;
  remoteState: PlayActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const PlayActivity = ({
  remoteState,
  dispatch: optionalDispatch,
  ...props
}: Props) => {
  const { isBoardFlipped } = usePlayActivitySettings();

  // TODO: Why would this be optional here? Could be outside!
  const dispatch = optionalDispatch || noop;

  return (
    <PlayContainer
      state={remoteState}
      dispatch={dispatch}
      isBoardFlipped={isBoardFlipped}
      {...props}
    />
  );
};
