import React, { useEffect, useState, useRef } from 'react';
import { Text } from '@app/components/Text';
import { SmartCountdown } from '@app/components/SmartCountdown';
import { swapColor } from '@xmatter/util-kit';
import { AbandonedGame } from '@app/modules/Game';
import { PlayersByColor } from '../../Play';
import { now } from '@app/lib/time';
import { useMatchActionsDispatch } from '../../hooks';
import { enqueueMovexUpdatePlay } from '../../utils';

type Props = {
  game: AbandonedGame;
  playersByColor: PlayersByColor;
  className?: string;
};

const ABANDON_TIMEOUT_MS = 30000; // 30 seconds

export const MatchAbandonedContainer = ({
  game,
  playersByColor,
  className,
}: Props) => {
  const dispatch = useMatchActionsDispatch();
  
  // Čuvaj abandonedAt u ref-u da se ne resetuje kada se game objekat promeni iz drugih razloga
  const abandonedAtRef = useRef<number>(game.abandonedAt);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = now() - game.abandonedAt;
    return Math.max(0, ABANDON_TIMEOUT_MS - elapsed);
  });

  const abandonedPlayer = playersByColor[game.abandonedBy];
  const remainingPlayer = playersByColor[swapColor(game.abandonedBy)];

  // Resetuj countdown samo kada se abandonedAt stvarno promeni (igrač ponovo napusti)
  useEffect(() => {
    // Ako se abandonedAt promenio, resetuj countdown
    if (abandonedAtRef.current !== game.abandonedAt) {
      abandonedAtRef.current = game.abandonedAt;
      
      // Očisti postojeći interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Resetuj state sa novim vremenom
      const elapsed = now() - game.abandonedAt;
      setTimeLeft(Math.max(0, ABANDON_TIMEOUT_MS - elapsed));
    }
  }, [game.abandonedAt]);

  // Kreiraj interval samo jednom, ali koristi ref za abandonedAt
  useEffect(() => {
    const interval = setInterval(() => {
      // Koristi ref umesto game.abandonedAt da se ne resetuje kada se game promeni
      const elapsed = now() - abandonedAtRef.current;
      const remaining = Math.max(0, ABANDON_TIMEOUT_MS - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        enqueueMovexUpdatePlay(() =>
          dispatch((masterContext) => ({
            type: 'play:checkTime',
            payload: {
              at: masterContext.requestAt(),
            },
          }))
        );
      }
    }, 100);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Prazan dependency array - interval se kreira samo jednom

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <div className="flex flex-col items-center gap-2">
        <Text className="text-sm md:text-md text-center">
          {abandonedPlayer?.displayName || 'Player'} has left the game
        </Text>
        <div className="flex gap-2 items-center">
          <Text className="text-sm md:text-md">
          {remainingPlayer?.displayName || 'You'} will be declared winner in
          </Text>
          <SmartCountdown
            msLeft={timeLeft}
            className="text-sm md:text-md font-bold text-green-600"
            isActive={timeLeft > 0}
            warningSound={undefined} // Isključi zvuk za ovaj countdown
          />
        </div>
      </div>
    </div>
  );
};