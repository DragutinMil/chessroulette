import React, { useState, useEffect, useMemo } from 'react';
import {
  SmartCountdownDisplay,
  SmartCountdownDisplayProps,
} from './SmartCountdownDisplay';
import { useInterval } from 'apps/chessroulette-web/hooks/useInterval';
import { lpad, timeLeftToIntervalMs, timeLeftToTimeUnits } from './util';
import { noop } from '@xmatter/util-kit';

export type SmartCountdownProps = {
  msLeft: number;
  isActive: boolean;
  className?: string;
  onFinished?: () => void;
} & Pick<
  SmartCountdownDisplayProps,
  'activeTextClassName' | 'inactiveTextClassName'
>;

export const SmartCountdown = ({
  msLeft,
  isActive,
  className,
  // Note - the onFinished prop changes do not trigger an update
  //  This is in order to not enter infinite loops when passing a callback
  onFinished = noop,
  ...countDownDislplayProps
}: SmartCountdownProps) => {
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(msLeft);
  const [interval, setInterval] = useState(timeLeftToIntervalMs(msLeft));

  useEffect(() => {
    setTimeLeft(msLeft);
  }, [msLeft]);

  useEffect(() => {
    if (!isActive) {
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

  const intervalPlay = isActive && !finished ? interval : undefined;

  useInterval(() => setTimeLeft((prev) => prev - interval), intervalPlay);

  const { major, minor } = useMemo(() => {
    const times = timeLeftToTimeUnits(timeLeft);
    if (times.hours > 0) {
      return {
        major: `${times.hours}h`,
        minor: `${lpad(times.minutes)}`,
        // canShowMilliseconds: false,
      };
    }
    return {
      major: lpad(times.minutes),
      minor: lpad(times.seconds),
      // canShowMilliseconds: false,
    };
  }, [timeLeft]);

  return (
    <div className={className}>
      {/* <pre className="text-xs">
        {JSON.stringify({
          f: finished,
          a: isActive,
          in: interval,
          pl: intervalPlay,
        })}
      </pre>
      <div className="flex flex-col ">
        <span
          className={`${isActive ? 'text-white' : 'text-slate-400'} text-md`}
        >
          {timeLeft}
        </span>
      </div> */}

      <SmartCountdownDisplay
        major={major}
        minor={minor}
        active={isActive}
        timeLeft={timeLeft}
        {...countDownDislplayProps}
        // canShowMilliseconds={canShowMilliseconds}
      />
    </div>
  );
};
