import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
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
  const startTimeRef = useRef<number>(Date.now());
  const initialMsLeft = useRef<number>(msLeft);
  const timeLeftRef = useRef<number>(msLeft);

  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;

    if (isActive) {
      startTimeRef.current =
        Date.now() - (initialMsLeft.current - timeLeftRef.current);
    }

  }, [isActive]);

  const recomputeTimeLeft = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    return Math.max(0, initialMsLeft.current - elapsed);
  }, []);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (warningSound) {
      warningAudioRef.current = new Audio(warningSound);
    }
  }, [warningSound]);

  useEffect(() => {
    setFinished(false);
    setTimeLeft(msLeft);
    startTimeRef.current = Date.now();
    initialMsLeft.current = msLeft;
    timeLeftRef.current = msLeft;

    if (msLeft > warningThresholdMs) {
      hasPlayedWarning.current = false;
    }
  }, [msLeft, warningThresholdMs]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        const newTimeLeft = recomputeTimeLeft();
        setTimeLeft(newTimeLeft);
        timeLeftRef.current = newTimeLeft;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, recomputeTimeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft <= 0 && !finished) {
      setFinished(true);
      onFinished();
    }
  }, [timeLeft, finished, onFinished]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (timeLeft <= 0) {
      setFinished(true);
    } else {
      setInterval(timeLeftToIntervalMs(timeLeft));

      if (
        timeLeft <= warningThresholdMs &&
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
  }, [finished, onFinished]);

  const intervalPlay = isActive && !finished ? interval : undefined;

  useInterval(() => {
    if (!isActiveRef.current) return;
    const newTimeLeft = recomputeTimeLeft();

    if (newTimeLeft !== timeLeftRef.current) {
      setTimeLeft(newTimeLeft);
      timeLeftRef.current = newTimeLeft;
      setInterval(timeLeftToIntervalMs(newTimeLeft));
    }
  }, intervalPlay);

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