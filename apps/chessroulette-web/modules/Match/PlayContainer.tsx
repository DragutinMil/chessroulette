import { useEffect } from 'react';
import { DistributiveOmit } from 'movex-core-util';
import { useCanPlay } from './Play/hooks/useCanPlay';
// import {
//   GameBoardContainer,
//   GameBoardContainerProps,
// } from './containers/GameBoardContainer';
import { UserId } from '../User';
import { ShortChessColor, isOneOf } from '@xmatter/util-kit';
import { MatchPlayers } from '@app/modules/Match/movex';
import { GameBoardContainer, GameBoardContainerProps } from './Play/containers';
import { useGame } from '../Game/hooks';
import { usePlayForUser } from './Play/hooks/usePlay';
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
  const play = usePlayForUser(userId);

  useEffect(() => {
    if (!play) {
      return;
    }

    // Advance the game to "idling" if the game is still in pending AND the User is the one of the players
    if (
      play.game.status === 'pending' &&
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
  }, [play, dispatch]);

  return (
    <GameBoardContainer {...gameBoardProps} canPlay={!!play?.canUserPlay} />
  );
};
