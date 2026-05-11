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
  botRating?: number;
  onCheckTime: () => void;
};

export const PlayerBox: React.FC<Props> = ({
  playerInfo,
  isActive,
  gameTimeClass,
  timeLeft,
  activeBot,
  botRating,
  onCheckTime,
}) => {
  return (
    <div className="flex flex-1 gap-3 items-center justify-between mr-0 pr-0 w-full">
      {activeBot && activeBot?.length > 0 ? (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          {playerInfo.points} &nbsp;
          {playerInfo.points !== undefined ? ' ' : ''}
          <span className="text-slate-300 font-bold">
            {playerInfo.displayName || activeBot}&nbsp;
          </span>
          {playerInfo.rating ? ` ${playerInfo.rating}` : '' || botRating}&nbsp;(
          {playerInfo.color})
        </div>
      ) : (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          <span className="inline-block w-3">{playerInfo.points}</span>&nbsp;
          {playerInfo.points !== undefined ? ' ' : ''}
          <span className="text-slate-300 font-bold">
            {' '}
            {playerInfo.displayName || 'guest'}{' '}
          </span>{' '}
          {playerInfo.rating ? ` ${playerInfo.rating}` : ''}&nbsp;(
          {playerInfo.color})
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
