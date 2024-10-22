import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { useCanPlay } from './Play/hooks/useCanPlay';
// import {
//   GameBoardContainer,
//   GameBoardContainerProps,
// } from './containers/GameBoardContainer';
import { UserId } from '../user';
import { ShortChessColor, isOneOf } from '@xmatter/util-kit';
import { MatchPlayers } from '@app/modules/Match/movex';
import { GameBoardContainer, GameBoardContainerProps } from './Play/containers';
import { useGame } from '../Game/hooks';
// import { MatchPlayers } from '@app/modules/Match';

// TODO: This should not be here!!!
// import type { MatchState } from '../../room/activities/Match/movex';

type Props = DistributiveOmit<GameBoardContainerProps, 'canPlay' | 'game'> & {
  players: MatchPlayers;
  userId: UserId;
  challengerColor: ShortChessColor;
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
  challengerColor,
  ...gameBoardProps
}: Props) => {
  const { dispatch } = gameBoardProps;
  // TODO: Check if the Display still works here - moving around in history resets the board?
  const game = useGame().committedState.game;
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
        type: 'play:start',
        payload: {
          // TODO: Make this a MasterAction and depend on the context.requestAt
          at: new Date().getTime(),
          challengerColor,
        },
      });
    }
  }, [canPlay, game.status, challengerColor, dispatch]);

  return <GameBoardContainer {...gameBoardProps} canPlay={canPlay} />;
};
