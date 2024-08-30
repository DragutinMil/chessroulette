import { LongChessColor } from '@xmatter/util-kit';
import { OngoingGame } from './types';

let prevAt: number | undefined;
export const calculateTimeLeftAt = ({
  at,
  lastMoveAt,
  turn,
  prevTimeLeft,
}: {
  at: number;
  lastMoveAt: number;
  turn: LongChessColor;
  prevTimeLeft: OngoingGame['timeLeft'];
}): OngoingGame['timeLeft'] => {
  const timeSince = new Date(at).getTime() - new Date(lastMoveAt).getTime();
  const nextTimeLeftForTurn = prevTimeLeft[turn] - timeSince;

  const next = {
    ...prevTimeLeft,
    [turn]: nextTimeLeftForTurn > 0 ? nextTimeLeftForTurn : 0,
  };

  console.log('CalculateTimeLeftAt()', `${prevAt ? at - prevAt : 'NaN'}ms`, {
    at,
    lastMoveAt,
    turn,
    prevTimeLeft,
    timeSince,
    nextTimeLeftForTurn,
    next,
  });

  prevAt = at;

  return next;
};
