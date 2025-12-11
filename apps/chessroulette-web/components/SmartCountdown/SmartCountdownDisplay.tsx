import { Text } from '@app/components/Text';
import { useEffect, useRef } from 'react';
export type SmartCountdownDisplayProps = {
  timeLeft: number;
  active: boolean;
  major: string;
  minor: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

export const SmartCountdownDisplay = ({
  timeLeft,
  major,
  minor,
  active,
  activeTextClassName = 'text-white    py-1 px-0 rounded-md   w-full    shadow-lg bg-slate-700 pl-2 pr-2',
  inactiveTextClassName = 'relative text-slate-400  py-1 px-0  rounded-md  w-full  backdrop-blur-lg shadow-lg pl-2 pr-2',
}: SmartCountdownDisplayProps) => {
  //51 65 85
  if (timeLeft <= 0) {
    return (
      <Text className="text-red-500 relative   py-1 px-0  rounded-md   w-full  backdrop-blur-lg shadow-lg ">
        00:00
      </Text>
    );
  }

  const shouldAlert = Number(major) < 1 && Number(minor) < 30;
  const shouldRing = Number(major) < 1 && Number(minor) == 30;

  useEffect(() => {
    const audio =
      typeof window !== 'undefined' ? new Audio('/warning.mp3') : null;
    if (shouldRing && audio) {
      audio.currentTime = 0; // reset
      audio.play().catch(() => {});
    }
  }, [shouldRing]);

  return (
    <Text className={active ? activeTextClassName : inactiveTextClassName} px-0>
      <Text className="font-bold w-[24px] md:w-[30px] ">{major}</Text>
      <Text>:</Text>
      <Text
        className={`font-thin w-[24px] md:w-[30px] inline-block text-left ${
          shouldAlert ? 'text-red-500 animate-pulse' : 'text'
        }`}
      >
        {minor}
      </Text>
    </Text>
  );
};
