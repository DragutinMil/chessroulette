import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { PlayBoardContainer, GameBoardContainerProps } from './Play/containers';
import { usePlay, usePlayActionsDispatch } from './Play/hooks/usePlay';

type Props = DistributiveOmit<GameBoardContainerProps, 'canPlay' | 'game'>;

export const PlayContainer = (gameBoardProps: Props) => {
  const play = usePlay();
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
    <PlayBoardContainer {...gameBoardProps} canPlay={!!play?.canUserPlay} />
  );
};
