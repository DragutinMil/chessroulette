import { Text } from 'apps/chessroulette-web/components/Text';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import React, { useState } from 'react';

type Props = {
  timeleft?: number;
};

export const NewGameCountdown: React.FC<Props> = ({ timeleft = 3 * 1000 }) => {
  const [display, setDisplay] = useState(timeleft);

  useInterval(() => {
    setDisplay((prev) => prev - 1000);
  }, 1000);

  return (
    <div className="">
      <Text className="text-red-500 animate-pulse font-bold">
        {Math.floor(display / 1000)}
      </Text>
    </div>
  );
};
