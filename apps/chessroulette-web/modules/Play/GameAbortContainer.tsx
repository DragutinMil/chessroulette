import { GameAbortView, GameAbortViewProps } from './components/GameAbortView';
import { PlayActions } from './store';
import { DispatchOf, invoke } from '@xmatter/util-kit';
import { MatchState } from '../room/activities/Match/movex';
import { useGame } from './providers/useGame';
import { chessGameTimeLimitMsMap } from './types';

type Props = Pick<GameAbortViewProps, 'className'> & {
  // // Not sure if here what we need is the match players
  players: MatchState['players'];
  dispatch: DispatchOf<PlayActions>;
};

/**
 * This must be a descendant of GameProvider
 *
 * @param param0
 * @returns
 */
export const GameAbortContainer = ({
  players,
  dispatch,
  ...gameAbortViewProps
}: Props) => {
  const {
    realState: { game, turn },
    playerId,
  } = useGame();

  if (game.status !== 'idling') {
    return null;
  }

  const isMyTurn = invoke(() => {
    if (!players) {
      return false;
    }

    return (
      (players.black.id === playerId && turn === 'black') ||
      (players.white.id === playerId && turn === 'white')
    );
  });

  // const totalTime =
  //   game.timeClass === 'untimed'
  //     ? 60 * 1000 // 1 min in Ms
  //     : chessGameTimeLimitMsMap[game.timeClass] / 10;
  const totalTime = 3 * 60 * 1000; // 3 min in ms

  // If it's white's turn there is no lastMoveAt so it needs to use game.startedAt
  const lastGameActionAt = game.lastMoveAt || game.startedAt;

  // TODO: Here we don't need the round downs no?
  const timeLeft = totalTime - (new Date().getTime() - lastGameActionAt);

  return (
    <GameAbortView
      {...gameAbortViewProps}
      onAbort={() => {
        dispatch({
          type: 'play:abortGame',
          payload: {
            color: turn,
          },
        });
      }}
      canAbortOnDemand={isMyTurn}
      timeLeft={timeLeft}
    />
  );
};
