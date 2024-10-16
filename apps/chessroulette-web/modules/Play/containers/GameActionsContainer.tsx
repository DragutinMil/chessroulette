import { ChessColor, DispatchOf } from '@xmatter/util-kit';
import { UserId } from '@app/modules/user';
import { GameActions } from '../components/GameActions';
import type { PlayActions } from '../movex';

type Props = {
  dispatch: DispatchOf<PlayActions>;
  homeColor: ChessColor;
  playerId: UserId;
};

/**
 * This must only be used inside the GameProvider or GameActionsProvider
 *
 * @param param0
 * @returns
 */
export const GameActionsContainer = ({
  dispatch,
  homeColor,
  playerId,
}: Props) => (
  <GameActions
    homeColor={homeColor}
    playerId={playerId}
    onOfferDraw={() => {
      dispatch({
        type: 'play:sendOffer',
        payload: { byPlayer: playerId, offerType: 'draw' },
      });
    }}
    onTakeback={() => {
      dispatch({
        type: 'play:sendOffer',
        payload: {
          byPlayer: playerId,
          offerType: 'takeback',
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
  />
);
