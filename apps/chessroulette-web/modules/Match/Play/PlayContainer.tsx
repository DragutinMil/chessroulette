import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { PlayBoardContainer, GameBoardContainerProps } from './containers';
import { useCurrentOrPrevMatchPlay, usePlayActionsDispatch } from './hooks';

export type PlayerContainerProps = DistributiveOmit<
  GameBoardContainerProps,
  'canPlay' | 'game'
>;

export const PlayContainer = (playBoardProps: PlayerContainerProps) => {
  const play = useCurrentOrPrevMatchPlay();
  const dispatch = usePlayActionsDispatch();

  useEffect(() => {
    if (!play.hasGame) {
      return;
    }

    // Advance the game to "idling" if the game is still in pending AND the User is the one of the players
    if (play.game.status === 'pending' && play.canUserPlay) {
      dispatch({
        type: 'play:start',
        payload: {
          // TODO: Make this a MasterAction and depend on the context.requestAt
          at: new Date().getTime(),
          // TODO: here might need to use challenger|challengee but for now it's ok
          players: {
            white: play.playersByColor.white.id,
            black: play.playersByColor.black.id,
          },
        },
      });
    }
  }, [play.game?.status, play.canUserPlay, dispatch]);

  return (
    <PlayBoardContainer {...playBoardProps} canPlay={!!play?.canUserPlay} />
  );
};
