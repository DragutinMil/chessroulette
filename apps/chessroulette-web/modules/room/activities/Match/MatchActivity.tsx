import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { noop } from '@xmatter/util-kit';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { PlayContainer } from '../../../Play/PlayContainer';
import { MatchActivityState } from './movex';
import { usePlayActivitySettings } from '../Play/usePlayActivitySettings';

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
