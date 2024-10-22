import { GameOverReason, OngoingGame } from '@app/modules/Game';
import { LongChessColor } from '@xmatter/util-kit';
// import { GameOverReason, OngoingGame } from './types';
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
): Result<[reason: GameOverReason, isDraw: boolean], void> => {
  if (hasTimedOut) {
    return new Ok([GameOverReason['timeout'], false]);
  }

  if (instance.isCheckmate()) {
    return new Ok([GameOverReason['checkmate'], instance.isDraw()]);
  }

  if (instance.isDraw()) {
    return new Ok([GameOverReason['draw'], true]);
  }

  if (instance.isInsufficientMaterial()) {
    return new Ok([GameOverReason['insufficientMaterial'], instance.isDraw()]);
  }

  if (instance.isStalemate()) {
    return new Ok([GameOverReason['stalemate'], instance.isDraw()]);
  }

  if (instance.isThreefoldRepetition()) {
    return new Ok([GameOverReason['threefoldRepetition'], instance.isDraw()]);
  }

  return Err.EMPTY;
};
