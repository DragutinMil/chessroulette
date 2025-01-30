import React from 'react';
import { SmartCountdown } from '@app/components/SmartCountdown';
import { PlayerInfoWithResults } from '@app/modules/Match/Play';
import { GameTimeClass } from '@app/modules/Game';

type Props = {
  playerInfo: PlayerInfoWithResults;
  isActive: boolean;
  gameTimeClass: GameTimeClass;
  timeLeft: number;
  onCheckTime: () => void;
};

export const PlayerBox: React.FC<Props> = ({
  playerInfo,
  isActive,
  gameTimeClass,
  timeLeft,
  onCheckTime,
}) => (
  <div className="flex flex-1 gap-3 items-center justify-between">
    <div
      className={`capitalize text-sm md:text-lg ${
        isActive ? 'text-white font-bold' : 'text-slate-400'
      }`}
    >
      {playerInfo.points}
      {playerInfo.points !== undefined ? ' ' : ''}
      {playerInfo.displayName || 'guest'} ({playerInfo.color})
    </div>
    {gameTimeClass !== 'untimed' && (
      <SmartCountdown
        isActive={isActive}
        msLeft={timeLeft}
        onFinished={onCheckTime}
        onRefreshMsLeft={onCheckTime}
        className="text-xl"
      />
    )}
  </div>
);
