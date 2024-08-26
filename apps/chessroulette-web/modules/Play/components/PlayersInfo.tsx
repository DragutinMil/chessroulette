import { ChessColor, ChessSide } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide, Results } from '../types';
import { calculateGameTimeLeftAt } from '../lib';
import { useCallback, useState } from 'react';
import { now } from 'apps/chessroulette-web/lib/time';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  onTimerFinished: (side: ChessSide) => void;
  gameCounterActive: boolean;
  results: Results;
  clientClockOffset: number;
};

export const PlayersInfo = ({
  players,
  game,
  results,
  gameCounterActive,
  turn,
  onTimerFinished,
  clientClockOffset,
}: PlayersInfoProps) => {
  const [calculatedGameTimeLeft, setCalculatedGameTimeLeft] = useState(
    calculateGameTimeLeftAt(now(), game)
  );

  const recalculateTimeLeft = useCallback(() => {
    setCalculatedGameTimeLeft(
      calculateGameTimeLeftAt(now() + clientClockOffset, game)
    );
  }, [setCalculatedGameTimeLeft, game, clientClockOffset]);

  return (
    <div className="flex flex-1 gap-1 flex-col">
      Clock Offset: {clientClockOffset}
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
        onRefreshTimeLeft={recalculateTimeLeft}
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
        onRefreshTimeLeft={recalculateTimeLeft}
      />
    </div>
  );
};
