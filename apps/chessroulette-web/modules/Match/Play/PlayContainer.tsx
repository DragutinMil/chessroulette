import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { useCurrentOrPrevMatchPlay, usePlayActionsDispatch } from './hooks';
import {
  GameBoardContainer,
  GameBoardContainerProps,
} from '@app/modules/Game/GameBoardContainer';

export type PlayerContainerProps = DistributiveOmit<
  GameBoardContainerProps,
  'canPlay' | 'onMove' | 'playingColor' | 'turn'
>;

export const PlayContainer = (playBoardProps: PlayerContainerProps) => {
  const play = useCurrentOrPrevMatchPlay();
  const dispatch = usePlayActionsDispatch();
  const moveSound = new Audio('/chessmove.mp3');
  useEffect(() => {
    if (!play.hasGame) {
      return;
    }

    // Advance the game to "idling" if the game is still in pending AND the User is the one of the players
    if (play.game.status === 'pending' && play.canUserPlay) {
      dispatch((masterContext) => ({
        type: 'play:start',
        payload: {
          at: masterContext.requestAt(),
          // TODO: here might need to use challenger|challengee but for now it's ok
          players: {
            w: play.playersByColor.w.id,
            b: play.playersByColor.b.id,
          },
        },
      }));
    }
  }, [play.game?.status, play.canUserPlay, dispatch]);

  return (
    <GameBoardContainer
      {...(play?.canUserPlay
        ? {
            canPlay: true,
            playingColor: play.playersBySide.home.color,
            turn: play.turn,
          }
        : {
            // Default props when the play doesn't exist
            canPlay: false,
            playingColor: play.playersBySide?.home.color || 'w',
            turn: 'b',
          })}
      onMove={(move) => {
        moveSound.play();
        dispatch((masterContext) => ({
          type: 'play:move',
          payload: {
            ...move,
            moveAt: masterContext.requestAt(),
          },
        }));

        // TODO: This can be returned from a more internal component
        return true;
      }}
      {...playBoardProps}
    />
  );
};
