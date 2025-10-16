import { useEffect, useRef } from 'react';
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
  //const moveSound = new Audio('/chessmove.mp3');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
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

  useEffect(() => {
    // Kreiramo novi AudioContext
    audioCtxRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const resumeAudio = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    document.addEventListener('click', resumeAudio);
    return () => document.removeEventListener('click', resumeAudio);
  }, []);

  useEffect(() => {
    console.log('koliko0');
    const playSound = async () => {
      if (play.game?.pgn !== '') {
        //sound on move
        const audioCtx = audioCtxRef.current;
        if (!audioCtx) return;

        if (!bufferRef.current) {
          const res = await fetch('/chessmove.mp3');
          const data = await res.arrayBuffer();
          bufferRef.current = await audioCtx.decodeAudioData(data);
        }

        const source = audioCtx.createBufferSource();
        source.buffer = bufferRef.current!;
        source.connect(audioCtx.destination);
        source.start();
      }
    };
    playSound();
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
      {...playBoardProps}
    />
  );
};
