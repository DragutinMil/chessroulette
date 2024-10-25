import { useMemo, useState } from 'react';
import { LongChessColor } from '@xmatter/util-kit';
import { now } from '@app/lib/time';
import { IdlingGame } from '@app/modules/Game';
import { GameAbort, GameAbortViewProps } from './MatchAbort';
import { MatchPlayers } from '../../movex';
import { useMatchActionsDispatch } from '../../hooks';

// TODO: I believe this can be either provided more, or just expose the onAbort rather then receiving the dispatch
type Props = Pick<GameAbortViewProps, 'className'> & {
  // Not sure if here what we need is the match players
  players: MatchPlayers;
  timeToAbortMs: number;
  game: IdlingGame;
  turn: LongChessColor;
  completedPlaysCount: number;
  playerId?: string;
};

export const MatchAbortContainer = ({
  players,
  timeToAbortMs,
  game,
  completedPlaysCount,
  playerId,
  turn,
  ...gameAbortViewProps
}: Props) => {
  const dispatch = useMatchActionsDispatch();

  const isMyTurn = useMemo(() => {
    if (!players) {
      return false;
    }

    return (
      (players.black.id === playerId && turn === 'black') ||
      (players.white.id === playerId && turn === 'white')
    );
  }, [turn, players]);

  const firstRound = useMemo(
    () => completedPlaysCount < 1,
    [completedPlaysCount]
  );

  const calculateTimeLeft = () => {
    // If it's white's turn there is no lastMoveAt so it needs to use game.startedAt
    const lastGameActionAt = game.lastMoveAt || game.startedAt;

    return timeToAbortMs - (now() - lastGameActionAt);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  return (
    <GameAbort
      {...gameAbortViewProps}
      onRefreshTimeLeft={() => {
        setTimeLeft(calculateTimeLeft());
      }}
      onAbort={() => {
        dispatch({
          type: 'play:abortGame',
          payload: { color: turn },
        });
      }}
      confirmContent={
        <div className="flex flex-row justify-center">
          <div>
            {firstRound
              ? 'If you abort, this match will be canceled and invalid!'
              : 'Be careful. If you Abort, you will lose the whole match!'}
          </div>
        </div>
      }
      canAbortOnDemand={isMyTurn}
      timeLeft={timeLeft}
    />
  );
};
