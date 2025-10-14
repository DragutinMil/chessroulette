import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SmartCountdownDisplay,
  SmartCountdownDisplayProps,
} from './SmartCountdownDisplay';
import { useInterval } from '@app/hooks/useInterval';
import { lpad, timeLeftToIntervalMs, timeLeftToTimeUnits } from './util';
import { noop } from '@xmatter/util-kit';

export type SmartCountdownProps = {
  msLeft: number;
  isActive: boolean;
  className?: string;
  onFinished?: () => void;
  warningSound?: string;
  warningThresholdMs?: number;
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
  warningSound = '/warning.mp3', // ili dodajte novi zvuk
  warningThresholdMs = 30000,
  ...countDownDislplayProps
}: SmartCountdownProps) => {
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(msLeft);
  const [interval, setInterval] = useState(timeLeftToIntervalMs(msLeft));

  const hasPlayedWarning = useRef(false);
  const warningAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevTimeLeft = useRef<number>(msLeft); // NOVO: pratimo prethodno vreme

  useEffect(() => {
    if (warningSound) {
      warningAudioRef.current = new Audio(warningSound);
    }
  }, [warningSound]);

  useEffect(() => {
    setTimeLeft(msLeft);
    prevTimeLeft.current = msLeft; // NOVO: update prethodno vreme
    if (msLeft > warningThresholdMs) {
      hasPlayedWarning.current = false;
    }
  }, [msLeft, warningThresholdMs]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
    } else {
      setInterval(timeLeftToIntervalMs(timeLeft));
       // Proveri da li treba pustiti zvučno upozorenje
       if (
        prevTimeLeft.current > warningThresholdMs && // bilo je IZNAD praga
        timeLeft <= warningThresholdMs &&             // sada je ISPOD praga
        !hasPlayedWarning.current &&
        warningAudioRef.current
      ) {
        warningAudioRef.current.play().catch((err) => {
          console.warn('Failed to play warning sound:', err);
        });
        hasPlayedWarning.current = true;
      }
    }
  }, [timeLeft, isActive, warningThresholdMs]);

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
      };
    }
    return {
      major: lpad(times.minutes),
      minor: lpad(times.seconds),
    };
  }, [timeLeft]);

  return (
    <div className={className}>
      <SmartCountdownDisplay
        major={major}
        minor={minor}
        active={isActive}
        timeLeft={timeLeft}
        {...countDownDislplayProps}
      />
    </div>
  );
};
