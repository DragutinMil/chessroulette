import { ChessColor, ChessSide, toLongColor } from '@xmatter/util-kit';
import { PlayerBox } from './PlayerBox';
import { Game } from '../store';
import { PlayersBySide, Results } from '../types';
import { useEffect, useRef, useState } from 'react';
import { getMovesDetailsFromPGN } from '../../room/activities/Match/utils';

export type PlayersInfoProps = {
  players: PlayersBySide;
  turn: ChessColor;
  game: Game;
  onTimerFinished: (side: ChessSide) => void;
  isGameOngoing: boolean;
  results: Results;
};

export const PlayersInfo = ({
  players,
  game,
  results,
  isGameOngoing,
  turn,
  onTimerFinished,
}: PlayersInfoProps) => {
  const isCounterActive = useRef(false);

  useEffect(() => {
    //save checking after each move
    if (!isCounterActive.current) {
      const moves = getMovesDetailsFromPGN(game.pgn);
      if (
        isGameOngoing &&
        moves.totalMoves > 0 &&
        moves.lastMoveBy &&
        toLongColor(moves.lastMoveBy) === 'black'
      ) {
        isCounterActive.current = true;
      }
    }
  }, [isGameOngoing, game.pgn]);

  return (
    <div className="flex flex-1 gap-1 flex-col">
      <PlayerBox
        key="away"
        playerInfo={players.away}
        score={results[players.away.color]}
        isActive={
          isCounterActive && isGameOngoing && turn === players.away.color
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
          isCounterActive && isGameOngoing && turn === players.home.color
        }
        gameTimeClass={game.timeClass}
        timeLeft={game.timeLeft[players.home.color]}
        onTimerFinished={() => onTimerFinished('home')}
      />
    </div>
  );
};
