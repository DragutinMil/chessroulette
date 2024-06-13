import { useMemo } from 'react';
import { Game } from '../store';
import { UsersMap } from '../../user/type';

// TODO: the Players can be a tuple?? or by color?
export const useCanPlay = (game: Game, players?: UsersMap) =>
  useMemo(() => {
    console.log('[use can play]', game, players);

    if (game.status === 'complete') {
      return false;
    }

    if (game.status === 'ongoing') {
      return true;
    }

    // if Pending, can play only if both players are present

    const [playerA, playerB] = Object.keys(players || {});

    return !!(playerA && playerB);
  }, [players, game.status]);
