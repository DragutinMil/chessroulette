import { LongChessColor } from '@xmatter/util-kit';
import { GameOverReason, OngoingGame } from './types';
import { Chess } from 'chess.js';
import { Err, Ok, Result } from 'ts-results';

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

export const checkIsGameOverWithReason = (
  instance: Chess,
  hasTimedOut: boolean
): Result<GameOverReason, void> => {
  if (hasTimedOut) {
    return new Ok('timeout');
  }

  if (instance.isCheckmate()) {
    return new Ok('checkmate');
  }

  if (instance.isDraw()) {
    return new Ok('draw');
  }

  if (instance.isInsufficientMaterial()) {
    return new Ok('insufficientMaterial');
  }

  if (instance.isStalemate()) {
    return new Ok('stalemate');
  }

  if (instance.isInsufficientMaterial()) {
    return new Ok('insufficientMaterial');
  }

  return Err.EMPTY;
};
