import { LongChessColor } from '@xmatter/util-kit';
import { OngoingGame } from './types';

// let prevAt: number | undefined;
export const calculateTimeLeftAt = ({
  at,
  // lastMoveAt,
  turn,
  prevTimeLeft,
}: {
  at: number;
  // lastMoveAt: number;
  turn: LongChessColor;
  prevTimeLeft: OngoingGame['timeLeft'];
}): OngoingGame['timeLeft'] => {
  const timeSince = at - prevTimeLeft.lastUpdatedAt;
  const nextTimeLeftForTurn = prevTimeLeft[turn] - timeSince;

  return {
    ...prevTimeLeft,
    [turn]: nextTimeLeftForTurn > 0 ? nextTimeLeftForTurn : 0,

    // Only update this if actually it is different
    ...(nextTimeLeftForTurn !== prevTimeLeft[turn] && {
      lastUpdatedAt: at,
    }),
  };
};
