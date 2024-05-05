import React, { useState, useEffect, useMemo } from 'react';
import { lpad, timeLeftToInterval, timeLeftToTimeUnits } from './util';
import { CountdownDisplay } from './CountdownDisplay';
import { chessGameTimeLimitMsMap } from './types';
import { noop } from 'movex-core-util';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import { GameType } from '../../types';

type Props = {
  gameTimeClass: GameType;
  timeLeft: number;
  active: boolean;
  onFinished?: () => void;
  className?: string;
  thumbnail?: boolean;
};

export const Countdown: React.FC<Props> = ({
  onFinished = () => noop,
  gameTimeClass,
  ...props
}) => {
  const [finished, setFinished] = useState(false as boolean);
  const [timeLeft, setTimeLeft] = useState(props.timeLeft);
  const [interval, setInterval] = useState(timeLeftToInterval(props.timeLeft));
  const [gameTimeClassInMs, setGameTimeClassInMs] = useState(
    chessGameTimeLimitMsMap[gameTimeClass]
  );

  useEffect(() => {
    setGameTimeClassInMs(chessGameTimeLimitMsMap[gameTimeClass]);
  }, [gameTimeClass]);

  useEffect(() => {}, [finished, props.active]);

  useInterval(
    () => {
      setTimeLeft((prev) => prev - interval);
    },
    finished || !props.active ? undefined : interval
  );

  useEffect(() => {
    setTimeLeft(props.timeLeft);
  }, [props.timeLeft]);

  useEffect(() => {
    setInterval(timeLeftToInterval(timeLeft));

    if (timeLeft <= 0 && props.active) {
      setFinished(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (finished) {
      onFinished();
    }
  }, [finished]);

  const { major, minor, canShowMilliseconds } = useMemo(() => {
    const times = timeLeftToTimeUnits(timeLeft);
    if (times.hours > 0) {
      return {
        major: `${times.hours}h`,
        minor: `${lpad(times.minutes)}`,
        canShowMilliseconds: false,
      };
    }
    return {
      major: lpad(times.minutes),
      minor: lpad(times.seconds),
      canShowMilliseconds: false,
    };
  }, [timeLeft, gameTimeClassInMs]);

  return (
    <div className={props.className}>
      <CountdownDisplay
        major={major}
        minor={minor}
        active={props.active}
        timeLeft={timeLeft}
        canShowMilliseconds={canShowMilliseconds}
        thumbnail={props.thumbnail}
      />
    </div>
  );
};
