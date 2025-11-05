import { OngoingGame } from '@app/modules/Game';
import { ChessColor } from '@xmatter/util-kit';
import { getTimeIncrement } from '@app/modules/Game/timeIncrement';

export const calculateTimeLeftAt = ({
  at,
  turn,
  prevTimeLeft,
  timeClass,
  isMove = false,
}: {
  at: number;
  turn: ChessColor;
  prevTimeLeft: OngoingGame['timeLeft'];
  timeClass: OngoingGame['timeClass'];
  isMove?: boolean;
}): OngoingGame['timeLeft'] => {
  const timeSince = at - prevTimeLeft.lastUpdatedAt;
  let nextTimeLeftForTurn = prevTimeLeft[turn] - timeSince;

  if (isMove) {
    const increment = getTimeIncrement(timeClass);
    nextTimeLeftForTurn += increment;
  }

  return {
    ...prevTimeLeft,
    [turn]: nextTimeLeftForTurn > 0 ? nextTimeLeftForTurn : 0,

    // Only update this if actually it is different
    ...(nextTimeLeftForTurn !== prevTimeLeft[turn] && {
      lastUpdatedAt: at,
    }),
  };
};
