import { ChessColor, ChessSide } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide, Results } from '../types';
import { calculateGameTimeLeftAt } from '../lib';
import { useEffect, useState } from 'react';
import { now } from 'apps/chessroulette-web/lib/time';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  onTimerFinished: (side: ChessSide) => void;
  gameCounterActive: boolean;
  results: Results;
};

export const PlayersInfo = ({
  players,
  game,
  results,
  gameCounterActive,
  turn,
  onTimerFinished,
}: PlayersInfoProps) => {
  const [calculatedGameTimeLeft, setCalculatedGameTimeLeft] = useState(
    calculateGameTimeLeftAt(now(), game)
  );

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        setCalculatedGameTimeLeft(calculateGameTimeLeftAt(now(), game));
      }
    };

    // Note: This checks when the tab is inactive and restarts it when reactivates
    //  This is because since Chrome 57, when the tab is inactive the timer stops or doesn't
    //  run accurately!
    // See https://usefulangle.com/post/280/settimeout-setinterval-on-inactive-tab
    //  or https://stackoverflow.com/questions/10563644/how-to-specify-http-error-code-using-express-js
    document.addEventListener('visibilitychange', handler);

    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, [game]);

  return (
    <div className="flex flex-1 gap-1 flex-col">
      <PlayerBox
        key="away"
        playerInfo={players.away}
        score={results[players.away.color]}
        isActive={
          gameCounterActive &&
          game.status === 'ongoing' &&
          turn === players.away.color
        }
        gameTimeClass={game.timeClass}
        timeLeft={calculatedGameTimeLeft[players.away.color]}
        onTimerFinished={() => onTimerFinished('away')}
      />
      <PlayerBox
        key="home"
        playerInfo={players.home}
        score={results[players.home.color]}
        isActive={
          gameCounterActive &&
          game.status === 'ongoing' &&
          turn === players.home.color
        }
        gameTimeClass={game.timeClass}
        timeLeft={calculatedGameTimeLeft[players.home.color]}
        onTimerFinished={() => onTimerFinished('home')}
      />
    </div>
  );
};
