import { SmartCountdown } from 'apps/chessroulette-web/components/SmartCountdown';
import { now } from 'apps/chessroulette-web/lib/time';
import { useState } from 'react';

type Props = {
  startedAt: number;
  onFinished: () => void;
  totalTimeAllowedMs: number;
};

const calculateTimeLeft = (totalTimeAllowedMs: number, fromTimestamp: number) =>
  totalTimeAllowedMs - (now() - fromTimestamp);

export const BetweenGamesAborter = ({
  startedAt,
  totalTimeAllowedMs,
  onFinished,
}: Props) => {
  const [timeLeft, setTimeLeft] = useState(
    calculateTimeLeft(totalTimeAllowedMs, startedAt)
  );

  return (
    <div className="flex gap-1">
      <span>Next game starts in</span>
      <SmartCountdown
        msLeft={timeLeft}
        isActive
        onFinished={onFinished}
        onRefreshMsLeft={() =>
          setTimeLeft(calculateTimeLeft(totalTimeAllowedMs, startedAt))
        }
      />
    </div>
  );
};
