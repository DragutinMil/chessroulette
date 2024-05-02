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
  active,
  canShowMilliseconds,
  major,
  minor,
  ...props
}) => {
  if (timeLeft > 0) {
    return (
      <Text className="">
        <Text className="font-bold">{major}</Text>
        <Text className="">:</Text>
        <Text
          className={`${
            Number(major) < 1 && Number(minor) < 30
              ? 'text-red-300'
              : 'text-white'
          }`}
        >
          {minor}
        </Text>
      </Text>
    );
  }

  return (
    <Text className="text-red-500">
      <Text className="">00:</Text>
      <Text className="">00</Text>
    </Text>
  );
};
