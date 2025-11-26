import { useEffect, useRef,useState } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { useCurrentOrPrevMatchPlay, usePlayActionsDispatch } from './hooks';
import {
  GameBoardContainer,
  GameBoardContainerProps,
} from '@app/modules/Game/GameBoardContainer';

const lastMoveWasPromotionCallbacks = new Set<(value: boolean) => void>();
export type PlayerContainerProps = DistributiveOmit<
  GameBoardContainerProps,
  'canPlay' | 'onMove' | 'playingColor' | 'turn'
>;

export const PlayContainer = (playBoardProps: PlayerContainerProps) => {
  const play = useCurrentOrPrevMatchPlay();
  const dispatch = usePlayActionsDispatch();

  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lastMoveWasPromotion, setLastMoveWasPromotion] = useState(false);
  useEffect(() => {
    moveAudioRef.current = new Audio('/chessmove.mp3');
  }, []);
    useEffect(() => {
      console.log('promotion playContainer')
    lastMoveWasPromotionCallbacks.forEach((callback) => {
      callback(lastMoveWasPromotion);
    });
  }, [lastMoveWasPromotion]);

  useEffect(() => {
    if (!play.hasGame) {
      return;
    }

    // Advance the game to "idling" if the game is still in pending AND the User is the one of the players
    if (play.game.status === 'pending' && play.canUserPlay) {
      const random = Math.floor(Math.random() * 1000) + 1;
      setTimeout(
        () =>
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
          })),

        random
      );
    }
  }, [play.game?.status, play.canUserPlay, dispatch]);

  useEffect(() => {
    if (play.game?.pgn !== '' && moveAudioRef.current) {
      // Resetujemo zvuk ako je već završio
      if (moveAudioRef.current.ended) {
        moveAudioRef.current.currentTime = 0;
      }
      // Pokušavamo da pustimo zvuk sa error handlingom
      moveAudioRef.current.play().catch((err) => {
        console.warn('Failed to play move sound:', err);
      });
    }
  }, [play.game?.lastMoveBy]);

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
       onLastMoveWasPromotionChange={setLastMoveWasPromotion}
      {...playBoardProps}
    />
  );
};
