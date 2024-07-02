import { ChessColor, ChessSide } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide, Results } from '../types';

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
        timeLeft={game.timeLeft[players.away.color]}
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
        timeLeft={game.timeLeft[players.home.color]}
        onTimerFinished={() => onTimerFinished('home')}
      />
    </div>
  );
};
