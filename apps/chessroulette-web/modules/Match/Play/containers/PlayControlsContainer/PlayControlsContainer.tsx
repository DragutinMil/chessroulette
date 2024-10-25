import { ChessColor } from '@xmatter/util-kit';
import { UserId } from '@app/modules/User';
import { PlayControls } from './PlayControls';
import { usePlay, usePlayActionsDispatch } from '../../hooks/usePlay';
import { PENDING_UNTIMED_GAME } from '@app/modules/Game';

type Props = {
  // homeColor: ChessColor;
  // playerId: UserId;
};

export const PlayControlsContainer = () => {
  const dispatch = usePlayActionsDispatch();
  const { lastOffer, game, playersBySide, hasGame } = usePlay();

  if (!hasGame) {
    return <>WARN| Play Controls Container No Game</>;
  }

  return (
    <PlayControls
      // homeColor={homeColor}
      // playerId={playerId}
      homeColor={playersBySide.home.color}
      playerId={playersBySide.home.id}
      onDrawOffer={() => {
        dispatch({
          type: 'play:sendOffer',
          // payload: { byPlayer: playerId, offerType: 'draw' },

          // TODO: left it here - this should be by color and that's it!
          payload: { byPlayer: playersBySide.home.id, offerType: 'draw' },
        });
      }}
      onTakebackOffer={() => {
        dispatch((masterContext) => ({
          type: 'play:sendOffer',
          payload: {
            byPlayer: playersBySide.home.id, // TODO: Change this to the player color instead since they are per game!
            offerType: 'takeback',
            timestamp: masterContext.requestAt(),
          },
        }));
      }}
      onResign={() => {
        dispatch({
          type: 'play:resignGame',
          payload: { color: playersBySide?.home.color },
        });
      }}
      game={game || PENDING_UNTIMED_GAME}
      lastOffer={lastOffer}
    />
  );
};
