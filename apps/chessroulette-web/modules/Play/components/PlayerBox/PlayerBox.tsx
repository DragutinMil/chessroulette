import React from 'react';
import { Countdown } from '../Countdown/Countdown';
import { GameTimeClass, PlayerInfo } from '../../types';

type Props = {
  playerInfo: PlayerInfo;
  isActive: boolean;
  gameTimeClass: GameTimeClass;
  timeLeft: number;
  onTimerFinished: () => void;
};

export const PlayerBox: React.FC<Props> = (props) => {
  const display = props.playerInfo.displayName
    ? `${props.playerInfo.displayName} (${props.playerInfo.color})`
    : props.playerInfo.color;

  return (
    <div className="flex flex-1 gap-3 items-center justify-between">
      <div
        className={`capitalize text-lg ${
          props.isActive ? 'text-white font-bold' : 'text-slate-400'
        }`}
      >
        {display}
      </div>
      {/* <div className='flex-1' /> */}
      {props.gameTimeClass !== 'untimed' && (
        <Countdown
          isActive={props.isActive}
          gameTimeClass={props.gameTimeClass}
          timeLeft={props.timeLeft}
          onFinished={props.onTimerFinished}
          className="text-xl"
        />
      )}
    </div>
  );
};
