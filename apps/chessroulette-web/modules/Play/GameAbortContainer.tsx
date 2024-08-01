import { GameAbortView, GameAbortViewProps } from './components/GameAbortView';
import { PlayActions } from './store';
import { DispatchOf, invoke } from '@xmatter/util-kit';
import { MatchState } from '../room/activities/Match/movex';
import { useGame } from './providers/useGame';
import { chessGameTimeLimitMsMap } from './types';
import { useMemo } from 'react';
import { useMatch } from '../room/activities/Match/providers/useMatch';

type Props = Pick<GameAbortViewProps, 'className'> & {
  // // Not sure if here what we need is the match players
  players: MatchState['players'];
  dispatch: DispatchOf<PlayActions>;
  timeToAbortMs: number;
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
  timeToAbortMs,
  ...gameAbortViewProps
}: Props) => {
  const {
    realState: { game, turn },
    playerId,
  } = useGame();
  const { completedPlaysCount } = useMatch();

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

  const firstRound = useMemo(() => {
    return completedPlaysCount < 1;
  }, [game]);

  // const totalTime =
  //   game.timeClass === 'untimed'
  //     ? 60 * 1000 // 1 min in Ms
  //     : chessGameTimeLimitMsMap[game.timeClass] / 10;
  // const totalTime = 3 * 60 * 1000; // 3 min in ms

  // If it's white's turn there is no lastMoveAt so it needs to use game.startedAt
  const lastGameActionAt = game.lastMoveAt || game.startedAt;

  // TODO: Here we don't need the round downs no?
  const timeLeft = timeToAbortMs - (new Date().getTime() - lastGameActionAt);

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
      firstRound={firstRound}
    />
  );
};
