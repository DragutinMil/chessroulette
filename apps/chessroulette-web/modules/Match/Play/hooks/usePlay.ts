import { useMemo } from 'react';
import { invoke, swapColor, toLongColor } from '@xmatter/util-kit';
import { getTurnFromPgn } from '@app/modules/Game/lib';
import { useMatchActionsDispatch, useMatchViewState } from '../../hooks';
import { Play, PlayersByColor, PlayersBySide } from '../types';
import { canUserPlay } from './util';
import { PlayActions } from '../store';
import { MovexDispatchAction } from 'movex';
import { useGame } from '@app/modules/Game/hooks';

export const usePlay = (): Play => {
  const { match, userAsPlayer } = useMatchViewState();

  // TODO: add the game if neede
  // const {} = useGame();

  return useMemo(() => {
    if (!match?.gameInPlay) {
      return { hasGame: false };
    }

    const { gameInPlay } = match;

    const playersBySide: PlayersBySide = invoke(() => {
      const challengerColor = toLongColor(gameInPlay.challengerColor);
      const challengeeColor = swapColor(challengerColor);

      if (userAsPlayer?.id === match.challengee.id) {
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
      hasGame: true,
      game: gameInPlay,
      turn: getTurnFromPgn(gameInPlay.pgn),
      playersByColor,
      playersBySide,
      ...invoke(() => {
        if (
          !!userAsPlayer &&
          canUserPlay({
            userId: userAsPlayer.id,
            playersByColor,
            game: gameInPlay,
          })
        ) {
          return {
            canUserPlay: true,
            userAsPlayerId: userAsPlayer.id,
          };
        } else {
          return {
            canUserPlay: false,
            userAsPlayerId: undefined,
          };
        }
      }),
      lastOffer: gameInPlay.offers?.slice(-1)[0],
    } satisfies Play;
  }, [match, userAsPlayer]);
};

export const usePlayActionsDispatch: () => MovexDispatchAction<PlayActions> =
  useMatchActionsDispatch;
