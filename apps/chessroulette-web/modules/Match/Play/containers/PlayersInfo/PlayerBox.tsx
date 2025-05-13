import React, { useEffect, useState } from 'react';
import { SmartCountdown } from '@app/components/SmartCountdown';
import { PlayerInfoWithResults } from '@app/modules/Match/Play';
import { GameTimeClass } from '@app/modules/Game';
import { useMatchViewState } from '../../../../../modules/Match/hooks/useMatch';
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
}) => {
  const { match } = useMatchViewState();
  const [isBotPlay, setBots] = useState(false);
  const [botName, setBotName] = useState('Bot');
  useEffect(() => {
    if (match) {
      setBots(
        [
          '8WCVE7ljCQJTW020',
          'NaNuXa7Ew8Kac002',
          'O8kiLgwcKJWy9005',
          'KdydnDHbBU1JY008',
          'vpHH6Jf7rYKwN010',
          'ruuPkmgP0KBei015',
        ].indexOf(match?.challengee?.id) !== -1
      );
      if (match?.challengee?.id == '8WCVE7ljCQJTW020') {
        setBotName('Botsworth');
      } else if (match?.challengee?.id == 'NaNuXa7Ew8Kac002') {
        setBotName('Botvik');
      } else if (match?.challengee?.id == 'O8kiLgwcKJWy9005') {
        setBotName('Botelia');
      } else if (match?.challengee?.id == 'KdydnDHbBU1JY008') {
        setBotName('Botaraj');
      } else if (match?.challengee?.id == 'vpHH6Jf7rYKwN010') {
        setBotName('Botxiang');
      } else if (match?.challengee?.id == 'ruuPkmgP0KBei015') {
        setBotName('Botko');
      }
    }
  }, []);

  return (
    <div className="flex flex-1 gap-3 items-center justify-between">
      {isBotPlay ? (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          {playerInfo.points}
          {playerInfo.points !== undefined ? ' ' : ''}
          {playerInfo.displayName || botName}({playerInfo.color})
        </div>
      ) : (
        <div
          className={`capitalize text-sm md:text-lg ${
            isActive ? 'text-white font-bold' : 'text-slate-400'
          }`}
        >
          {playerInfo.points}
          {playerInfo.points !== undefined ? ' ' : ''}
          {playerInfo.displayName || 'guest'}({playerInfo.color})
        </div>
      )}
      {gameTimeClass !== 'untimed' && (
        <SmartCountdown
          isActive={isActive}
          msLeft={timeLeft}
          onFinished={onCheckTime}
          onRefreshMsLeft={onCheckTime}
          className="text-xl md:text-2xl  w-[90px]"
        />
      )}
    </div>
  );
};
