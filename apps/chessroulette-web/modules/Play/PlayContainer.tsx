import { useEffect } from 'react';
import { useCanPlay } from './hooks/useCanPlay';
import {
  GameBoardContainer,
  GameBoardContainerProps,
} from './GameBoardContainer';
import { MatchState } from '../room/activities/Match/movex';
import { UserId } from '../user';
import { DistributiveOmit } from 'movex-core-util';
import { isOneOf } from '@xmatter/util-kit';

type Props = DistributiveOmit<GameBoardContainerProps, 'canPlay'> & {
  players: MatchState['players'];
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
