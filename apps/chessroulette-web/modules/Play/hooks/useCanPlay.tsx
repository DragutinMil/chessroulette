import { useMemo } from 'react';
import { Game } from '../store';
import { UserId, UsersMap } from '../../user/type';

// TODO: the Players can be a tuple?? or by color?
export const useCanPlay = (game: Game, players?: UsersMap, player?: UserId) =>
  useMemo(() => {
    if (!players || (player && !players[player])) {
      return false;
    }
    if (game.status === 'complete') {
      return false;
    }

    if (game.status === 'ongoing') {
      return true;
    }

    // if Pending, can play only if both players are present

    const [playerA, playerB] = Object.keys(players || {});

    return !!(playerA && playerB);
  }, [players, game.status, player]);
