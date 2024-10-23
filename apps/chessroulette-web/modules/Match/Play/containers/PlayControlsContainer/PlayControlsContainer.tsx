import { ChessColor, DispatchOf } from '@xmatter/util-kit';
import { UserId } from '@app/modules/User';
import type { PlayActions } from '../../store';
import { PlayControls } from './PlayControls';
import { useGame } from '@app/modules/Game/hooks';

type Props = {
  dispatch: DispatchOf<PlayActions>;
  homeColor: ChessColor;
  playerId: UserId;
};

export const PlayControlsContainer = ({
  dispatch,
  homeColor,
  playerId,
}: Props) => {
  const { lastOffer, committedState } = useGame();

  return (
    <PlayControls
      homeColor={homeColor}
      playerId={playerId}
      onDrawOffer={() => {
        dispatch({
          type: 'play:sendOffer',
          payload: { byPlayer: playerId, offerType: 'draw' },
        });
      }}
      onTakebackOffer={() => {
        dispatch({
          type: 'play:sendOffer',
          payload: {
            byPlayer: playerId,
            offerType: 'takeback',
            // TODO: use master context
            timestamp: new Date().getTime(),
          },
        });
      }}
      onResign={() => {
        dispatch({
          type: 'play:resignGame',
          payload: { color: homeColor },
        });
      }}
      game={committedState.game}
      lastOffer={lastOffer}
    />
  );
};
