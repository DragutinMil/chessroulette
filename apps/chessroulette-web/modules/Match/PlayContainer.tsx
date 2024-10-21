import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { useCanPlay } from '../Play/hooks/useCanPlay';
// import {
//   GameBoardContainer,
//   GameBoardContainerProps,
// } from './containers/GameBoardContainer';
import { UserId } from '../user';
import { isOneOf } from '@xmatter/util-kit';
import { MatchPlayers } from '@app/modules/Match/movex';
import { GameBoardContainer, GameBoardContainerProps } from '../Play/containers';
// import { MatchPlayers } from '@app/modules/Match';

// TODO: This should not be here!!!
// import type { MatchState } from '../../room/activities/Match/movex';

type Props = DistributiveOmit<GameBoardContainerProps, 'canPlay'> & {
  players: MatchPlayers;
  userId: UserId;
};

/**
 * This must be used as a descendant of the GameProvider only
 *
 * @param param0
 * @returns
 */
export const PlayContainer = ({
  players,
  userId,
  ...gameBoardProps
}: Props) => {
  const { game, dispatch } = gameBoardProps;
  const canPlay = useCanPlay({ game, players, userId });

  useEffect(() => {
    // Advance the game to "idling" if the game is still in pending AND the User is the one of the players
    if (
      game.status === 'pending' &&
      isOneOf(
        userId,
        [players.white, players.black].map((p) => p.id)
      )
    ) {
      dispatch({
        type: 'play:startWhitePlayerIdlingTimer',
        payload: {
          at: new Date().getTime(),
        },
      });
    }
  }, [canPlay, game.status, dispatch]);

  return <GameBoardContainer {...gameBoardProps} canPlay={canPlay} />;
};
