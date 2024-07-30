import React, { useState, useEffect, useMemo } from 'react';
import { CountdownDisplay } from './CountdownDisplay';
import { noop } from 'movex-core-util';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import { GameTimeClass, chessGameTimeLimitMsMap } from '../../types';
import {
  lpad,
  timeLeftToIntervalMs,
  timeLeftToTimeUnits,
} from '../../lib/utils';

type Props = {
  gameTimeClass: GameTimeClass;
  timeLeft: number;
  isActive: boolean;
  onFinished?: () => void;
  className?: string;
  thumbnail?: boolean;
};

export const Countdown: React.FC<Props> = ({
  onFinished = () => noop,
  gameTimeClass,
  ...props
}) => {
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(props.timeLeft);
  const [interval, setInterval] = useState(
    timeLeftToIntervalMs(props.timeLeft)
  );
  const [gameTimeClassInMs, setGameTimeClassInMs] = useState(
    chessGameTimeLimitMsMap[gameTimeClass]
  );

  useEffect(() => {
    setTimeLeft(props.timeLeft);
  }, [props.timeLeft]);

  useEffect(() => {
    if (!props.isActive) {
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
    } else {
      setInterval(timeLeftToIntervalMs(timeLeft));
    }
  }, [timeLeft]);

  useEffect(() => {
    if (finished) {
      onFinished();
    }
  }, [finished]);

  useEffect(() => {
    setGameTimeClassInMs(chessGameTimeLimitMsMap[gameTimeClass]);
  }, [gameTimeClass]);

  useInterval(
    () => {
      setTimeLeft((prev) => prev - interval);
    },
    finished || props.isActive ? interval : undefined
  );

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
        active={props.isActive}
        timeLeft={timeLeft}
        canShowMilliseconds={canShowMilliseconds}
        thumbnail={props.thumbnail}
      />
    </div>
  );
};
