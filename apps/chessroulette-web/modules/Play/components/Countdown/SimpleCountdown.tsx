import { Text } from 'apps/chessroulette-web/components/Text';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import React, { useEffect, useState } from 'react';
import prettyMs from 'pretty-ms';

type Props = {
  msleft: number;
  refreshInterval?: number;
  onFinished: () => void;
};

const toSeconds = (ms: number) => Math.floor(ms / 1000);

const positiveOrZero = (n: number) => (n < 0 ? 0 : n);

export const SimpleCountdown: React.FC<Props> = ({
  msleft = 10 * 1000,
  refreshInterval = 10,
  onFinished,
}) => {
  const [display, setDisplay] = useState(positiveOrZero(msleft));

  useEffect(() => {
    setDisplay(msleft);
  }, [msleft]);

  useInterval(() => {
    setDisplay((prev) => positiveOrZero(prev - refreshInterval));
  }, refreshInterval);

  useEffect(() => {
    if (display === 0) {
      onFinished();
    }
  }, [display === 0]);

  return (
    <Text className="text-red-500 animate-pulse font-bold block">
      {prettyMs(toSeconds(display) * 1000, { colonNotation: true })}
    </Text>
  );
};
