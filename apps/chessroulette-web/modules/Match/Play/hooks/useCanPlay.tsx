import { useMemo } from 'react';
import { Game } from '@app/modules/Game';
import { PlayersByColor } from '../store';
import { isOneOf } from '@xmatter/util-kit';
import { UserId } from '@app/modules/User';

export const useCanPlay = ({
  game,
  players,
  userId,
}: {
  game: Game;
  userId: UserId;
  // TODO: Not sure if the players here should be the MatchState['players'] or represented differently at this level!
  //  by dide or by id?
  // players: MatchPlayers;
  players: PlayersByColor;
}) =>
  useMemo(() => {
    //TODO - repair this - somehow none of the players can play
    // if (!players || (player && !players[player])) {
    //   return false;
    // }

    // Id the userId is not part of the players s/he cannot play
    if (!(players.white.id === userId || players.black.id === userId)) {
      return false;
    }

    if (isOneOf(game.status, ['complete', 'aborted'])) {
      return false;
    }

    if (game.status === 'ongoing') {
      return true;
    }

    // if Pending, can play only if both players are present
    const [playerA, playerB] = Object.keys(players);

    return !!(playerA && playerB);
  }, [players, game.status, userId]);
