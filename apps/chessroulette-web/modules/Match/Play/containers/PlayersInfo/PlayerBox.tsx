import React, { useEffect, useState } from 'react';
import { SmartCountdown } from '@app/components/SmartCountdown';
import { PlayerInfoWithResults } from '@app/modules/Match/Play';
import { GameTimeClass } from '@app/modules/Game';
import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
import { findIfBots } from '../../../utils';
type Props = {
  playerInfo: PlayerInfoWithResults;
  isActive: boolean;
  gameTimeClass: GameTimeClass;
  timeLeft: number;
  activeBot?: string;
  onCheckTime: () => void;
};

export const PlayerBox: React.FC<Props> = ({
  playerInfo,
  isActive,
  gameTimeClass,
  timeLeft,
  activeBot,
  onCheckTime,
}) => {
  // const { match } = useMatchViewState();

  // const [botName, setBotName] = useState('Bot');
  // useEffect(() => {
  //   if(match){
  //    const bot = findIfBots(match?.challengee.id, match?.challenger.id)
  //    if(bot){
  //      setBotName(bot.name)
  //      setBots(true)
  //    }
  //   }
  // }, []);

  return (
    <div className="flex flex-1 gap-3 items-center justify-between mr-0 pr-0 w-full">
      {activeBot && activeBot?.length > 0 ? (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          {playerInfo.points}
          {playerInfo.points !== undefined ? ' ' : ''}
          {playerInfo.displayName || activeBot}&nbsp;({playerInfo.color})
        </div>
      ) : (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          <span className="inline-block w-3">{playerInfo.points}</span>
          {playerInfo.points !== undefined ? ' ' : ''}
          {playerInfo.displayName || 'guest'}&nbsp;({playerInfo.color})
        </div>
      )}
      {gameTimeClass !== 'untimed' && (
        <SmartCountdown
          isActive={isActive}
          msLeft={timeLeft}
          onFinished={onCheckTime}
          onRefreshMsLeft={onCheckTime}
          className="text-xl md:text-2xl  ml-auto p-0  w-20 md:w-44 text-right"
        />
      )}
    </div>
  );
};
