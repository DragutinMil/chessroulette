import { ChessColor } from '@xmatter/util-kit';
import { Old_Play_Results, PlayersBySide } from '@app/modules/Match/Play';
import { Game } from '@app/modules/Game';
import { PlayerBox } from './PlayerBox';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  gameCounterActive: boolean;
  results: Old_Play_Results;
  onCheckTime: () => void;
};

export const PlayersInfo = ({
  players,
  game,
  results,
  gameCounterActive,
  turn,
  onCheckTime,
}: PlayersInfoProps) => (
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
      onCheckTime={onCheckTime}
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
      onCheckTime={onCheckTime}
    />
  </div>
);
