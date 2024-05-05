import { DependencyList, useEffect, useState } from 'react';
import { PlayActivityState } from '../movex';

type Game = PlayActivityState['activityState']['game'];

const getPlayersTimeLeftByColor = (game: Game) => {
  const now = new Date().getTime();

  return {
    white:
      game.state === 'ongoing' && game.lastMoveBy !== 'white'
        ? game.timeLeft.white - (now - new Date(game.lastMoveAt).getTime())
        : game.timeLeft.white,
    black:
      game.state === 'ongoing' && game.lastMoveBy !== 'black'
        ? game.timeLeft.black - (now - new Date(game.lastMoveAt).getTime())
        : game.timeLeft.black,
  } as const;
};

export const useGameTimeLeft = (game: Game, deps: DependencyList = []) => {
  const [timeLeft, setTimeLeft] = useState(getPlayersTimeLeftByColor(game));

  useEffect(() => {
    setTimeLeft(getPlayersTimeLeftByColor(game));
  }, [game, ...deps]);

  return timeLeft;
};
