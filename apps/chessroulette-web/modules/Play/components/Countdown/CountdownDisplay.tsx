import React from 'react';
import { Text } from 'apps/chessroulette-web/components/Text';

type Props = {
  timeLeft: number;
  canShowMilliseconds: boolean;
  active: boolean;
  major: string;
  minor: string;
  thumbnail?: boolean;
};

export const CountdownDisplay: React.FC<Props> = ({
  timeLeft,
  major,
  minor,
  active,
}) => {
  if (timeLeft > 0) {
    return (
      <Text className={active ? 'text-white' : 'text-slate-400'}>
        <Text className="font-bold">{major}</Text>
        <Text>:</Text>
        <Text
          className={`font-thin ${
            Number(major) < 1 &&
            Number(minor) < 30 &&
            'text-red-400 animate-pulse'
          }`}
        >
          {minor}
        </Text>
      </Text>
    );
  }

  return (
    <Text className="text-red-500">
      <Text>00:</Text>
      <Text>00</Text>
    </Text>
  );
};
