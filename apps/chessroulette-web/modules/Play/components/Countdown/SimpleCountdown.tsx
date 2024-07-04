import { Text } from 'apps/chessroulette-web/components/Text';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import React, { useEffect, useState } from 'react';
import prettyMs from 'pretty-ms';

type Props = {
  timeleft?: number;
  onFinished: () => void;
};

const toSeconds = (ms: number) => Math.floor(ms / 1000);

export const SimpleCountdown: React.FC<Props> = ({
  timeleft = 10 * 1000,
  onFinished,
}) => {
  const [display, setDisplay] = useState(timeleft);

  useEffect(() => {
    setDisplay(timeleft);
  }, [toSeconds(timeleft)]);

  useInterval(() => {
    setDisplay((prev) => {
      const next = prev - 1000;

      if (next <= 0) {
        return 0;
      }

      return next;
    });
  }, 1000);

  useEffect(() => {
    if (display === 0) {
      onFinished();
    }
  }, [timeleft > 0 && display === 0]);

  return (
    <div className="">
      <Text className="text-red-500 animate-pulse font-bold">
        {prettyMs(toSeconds(display) * 1000, { colonNotation: true })}
      </Text>
    </div>
  );
};
