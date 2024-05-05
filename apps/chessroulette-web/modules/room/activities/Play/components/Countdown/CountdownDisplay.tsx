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
        <Text className="">{major}</Text>
        <Text className="">:</Text>
        <Text className="">{minor}</Text>
      </Text>
    );
  }

  return (
    <Text className="">
      <Text className="">00:</Text>
      <Text className="">00</Text>
    </Text>
  );
};
