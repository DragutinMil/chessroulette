import { Play, PlayersByColor, PlayersBySide } from '../types';
import { invoke, swapColor, toLongColor } from '@xmatter/util-kit';
import { UserId } from '@app/modules/User';
import { getTurnFromPgn } from '@app/modules/Game/lib';
import { useMatch } from '../../hooks';
import { canUserPlay } from './util';
import { useMemo } from 'react';

export const usePlayForUser = (userId: UserId): Play | undefined => {
  const match = useMatch();

  return useMemo(() => {
    if (!match?.gameInPlay) {
      return undefined;
    }

    const { gameInPlay } = match;

    const playersBySide: PlayersBySide = invoke(() => {
      const challengerColor = toLongColor(gameInPlay.challengerColor);
      const challengeeColor = swapColor(challengerColor);

      if (userId === match.challengee.id) {
        return {
          home: {
            ...match.challengee,
            color: challengeeColor,
          },
          away: {
            ...match.challenger,
            color: challengerColor,
          },
        };
      }

      return {
        home: {
          ...match.challenger,
          color: challengerColor,
        },
        away: {
          ...match.challengee,
          color: challengeeColor,
        },
      };
    });

    const playersByColor: PlayersByColor = invoke(() =>
      gameInPlay.challengerColor === 'w'
        ? {
            white: {
              ...match.challenger,
              color: 'white',
            },
            black: {
              ...match.challengee,
              color: 'black',
            },
          }
        : {
            white: {
              ...match.challengee,
              color: 'white',
            },
            black: {
              ...match.challenger,
              color: 'black',
            },
          }
    );

    return {
      game: gameInPlay,
      turn: getTurnFromPgn(gameInPlay.pgn),
      playersByColor,
      playersBySide,
      canUserPlay: canUserPlay({ userId, playersByColor, game: gameInPlay }),
      lastOffer: gameInPlay.offers?.slice(-1)[0],
    };
  }, [match]);
};
