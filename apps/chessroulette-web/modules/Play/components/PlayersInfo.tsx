import { ChessColor, ChessSide } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide, Results } from '../types';
// import { calculateGameTimeLeftAt } from '../lib';
import { useCallback, useState } from 'react';
import { now } from 'apps/chessroulette-web/lib/time';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  // onTimerFinished: (side: ChessSide) => void;
  onCheckTime: () => void;
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
  onCheckTime,
  clientClockOffset,
}: PlayersInfoProps) => {
  const [calculatedGameTimeLeft, setCalculatedGameTimeLeft] = useState(
    game.timeLeft
    // calculateGameTimeLeftAt(now(), game)
  );

  const recalculateTimeLeft = useCallback(() => {
    console.log(
      'attempt to recalculate the timeLeft but I need to ask the server!'
    );
    // setCalculatedGameTimeLeft(
    //   calculateGameTimeLeftAt(now() + clientClockOffset, game)
    // );
  }, [setCalculatedGameTimeLeft, game, clientClockOffset]);

  return (
    <div className="flex flex-1 gap-1 flex-col">
      {/* Clock Offset: {clientClockOffset} */}
      {game.timeLeft[players.away.color]}ms left
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
        // onTimerFinished={onCheckTime}
        onCheckTime={onCheckTime}
      />
      {game.timeLeft[players.home.color]}ms left
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
        // onTimerFinished={onCheckTime}
        onCheckTime={onCheckTime}
      />
    </div>
  );
};
