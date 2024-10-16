import React from 'react';
import { GameTimeClass, PlayerInfo } from '../../types';
import { SmartCountdown } from '@app/components/SmartCountdown';

type Props = {
  playerInfo: PlayerInfo;
  isActive: boolean;
  gameTimeClass: GameTimeClass;
  timeLeft: number;
  score: number;
  onCheckTime: () => void;
};

export const PlayerBox: React.FC<Props> = (props) => {
  const display = props.playerInfo.displayName
    ? `${props.score} ${props.playerInfo.displayName} (${props.playerInfo.color})`
    : `${props.score} ${props.playerInfo.color}`;

  return (
    <div className="flex flex-1 gap-3 items-center justify-between">
      <div
        className={`capitalize text-lg ${
          props.isActive ? 'text-white font-bold' : 'text-slate-400'
        }`}
      >
        {display}
      </div>
      {props.gameTimeClass !== 'untimed' && (
        <SmartCountdown
          isActive={props.isActive}
          msLeft={props.timeLeft}
          onFinished={props.onCheckTime}
          onRefreshMsLeft={props.onCheckTime}
          className="text-xl"
        />
      )}
    </div>
  );
};
