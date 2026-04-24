import { useEffect, useRef, useState } from 'react';
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
> & {
  stopEngineMove?: boolean;
  botId?: string;
  userRating?: number;
  botType?: string;
};

export const PlayContainer = (
  playBoardProps: PlayerContainerProps,
  stopEngineMove: boolean,
  botId?: string,
  userRating?: number,
  botType?: string
) => {
  const play = useCurrentOrPrevMatchPlay();
  const dispatch = usePlayActionsDispatch();
  const lastDispatchAtRef = useRef(0);
  const pendingDispatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const [lastMoveWasPromotion, setLastMoveWasPromotion] = useState(false);
  useEffect(() => {
    moveAudioRef.current = new Audio('/chessmove.mp3');
    return () => {
      if (pendingDispatchRef.current) clearTimeout(pendingDispatchRef.current);
    };
  }, []);
  useEffect(() => {
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
        const doDispatch = () => {
          lastDispatchAtRef.current = Date.now();
          dispatch((masterContext) => ({
            type: 'play:move',
            payload: {
              ...move,
              moveAt: masterContext.requestAt(),
            },
          }));
        };

        const now = Date.now();
        const timeSinceLast = now - lastDispatchAtRef.current;

        // Bot igre: svaki dispatch koristi requestAt() (server timestamp) što uvek
        // uzrokuje checksum mismatch → resyncLocalState(). Ako dva dispatcha stignu
        // pre nego što se prvi resync završi, oba pozovu syncState() na istom
        // PromiseDelegate → "already settled" crash.
        // Fix: drugi dispatch (premove) odložiti dok se prvi ne slegne (~500ms).
        if (timeSinceLast < 500 && botType) {
          if (pendingDispatchRef.current) clearTimeout(pendingDispatchRef.current);
          pendingDispatchRef.current = setTimeout(() => {
            pendingDispatchRef.current = null;
            doDispatch();
          }, 500 - timeSinceLast);
          return true;
        }

        if (pendingDispatchRef.current) {
          clearTimeout(pendingDispatchRef.current);
          pendingDispatchRef.current = null;
        }

        doDispatch();
        return true;
      }}
      stopEngineMove={stopEngineMove}
      botId={botId}
      botType={botType}
      userRating={userRating}
      onLastMoveWasPromotionChange={setLastMoveWasPromotion}
      {...playBoardProps}
    />
  );
};
