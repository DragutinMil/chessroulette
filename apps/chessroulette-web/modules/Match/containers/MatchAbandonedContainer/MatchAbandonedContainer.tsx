import React, { useEffect, useState } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = now() - game.abandonedAt;
    return Math.max(0, ABANDON_TIMEOUT_MS - elapsed);
  });

  const abandonedPlayer = playersByColor[game.abandonedBy];
  const remainingPlayer = playersByColor[swapColor(game.abandonedBy)];

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = now() - game.abandonedAt;
      const remaining = Math.max(0, ABANDON_TIMEOUT_MS - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
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

    return () => clearInterval(interval);
  }, [game.abandonedAt]);

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
          />
        </div>
      </div>
    </div>
  );
};