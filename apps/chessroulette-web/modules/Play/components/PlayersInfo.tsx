import { ChessColor, ChessSide } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide } from '../types';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  onTimerFinished: (side: ChessSide) => void;
  isGameOngoing: boolean;
};

export const PlayersInfo = ({
  players,
  game,
  isGameOngoing,
  turn,
  onTimerFinished,
}: PlayersInfoProps) => (
  <div className="flex flex-1 gap-1 flex-col">
    <PlayerBox
      key="away"
      playerInfo={players.away}
      isActive={isGameOngoing && turn === players.away.color}
      gameTimeClass={game.timeClass}
      timeLeft={game.timeLeft[players.away.color]}
      onTimerFinished={() => onTimerFinished('away')}
    />
    <PlayerBox
      key="home"
      playerInfo={players.home}
      isActive={isGameOngoing && turn === players.home.color}
      gameTimeClass={game.timeClass}
      timeLeft={game.timeLeft[players.home.color]}
      onTimerFinished={() => onTimerFinished('home')}
    />
  </div>
);
