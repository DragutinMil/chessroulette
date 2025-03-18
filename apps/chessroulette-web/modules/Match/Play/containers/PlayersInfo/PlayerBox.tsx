import React ,{useEffect,useState} from 'react';
import { SmartCountdown } from '@app/components/SmartCountdown';
import { PlayerInfoWithResults } from '@app/modules/Match/Play';
import { GameTimeClass } from '@app/modules/Game';
import {
  useMatchViewState,
} from '../../../../../modules/Match/hooks/useMatch';
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
}) =>{
  const { match } = useMatchViewState();
  const[isBotPlay, setBots] = useState(false)
useEffect(() => {
    if(match){
      setBots( ['8WCVE7ljCQJTW020','NaNuXa7Ew8Kac002','O8kiLgwcKJWy9005','KdydnDHbBU1JY008','vpHH6Jf7rYKwN010','ruuPkmgP0KBei015'].indexOf(match?.challengee?.id)!==-1 )
    }
  }, []);

 return(
  <div className="flex flex-1 gap-3 items-center justify-between">
    {isBotPlay? (
           <div
           className={`capitalize text-sm md:text-lg ${
             isActive ? 'text-white font-bold' : 'text-slate-400'
           }`}
         >
           {playerInfo.points}
           {playerInfo.points !== undefined ? ' ' : ''}
           
           {playerInfo.displayName || 'Bot'}
         
           ({playerInfo.color})
         </div>
      ):(
    <div
      className={`capitalize text-sm md:text-lg ${
        isActive ? 'text-white font-bold' : 'text-slate-400'
      }`}
    >
      {playerInfo.points}
      {playerInfo.points !== undefined ? ' ' : ''}
      
        {playerInfo.displayName || 'guest'}
    
      ({playerInfo.color})
    </div> 
      )}
    {gameTimeClass !== 'untimed' && (
      <SmartCountdown
        isActive={isActive}
        msLeft={timeLeft}
        onFinished={onCheckTime}
        onRefreshMsLeft={onCheckTime}
        className="text-xl md:text-2xl"
      />
    )}
  </div>
);
}
