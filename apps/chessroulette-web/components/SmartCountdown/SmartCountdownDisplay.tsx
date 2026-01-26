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
  const hasPlayedSoundInThisCycleRef = useRef(false);
  const maxTimeLeftRef = useRef(timeLeft);
  const componentIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (timeLeft > maxTimeLeftRef.current) {
      // Novi countdown ciklus - resetuj flag
      maxTimeLeftRef.current = timeLeft;
      hasPlayedSoundInThisCycleRef.current = false;
      console.log(`[SmartCountdownDisplay ${componentIdRef.current}] New countdown cycle started. Max time: ${maxTimeLeftRef.current}ms`);
    }
  }, [timeLeft]);

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
    // Reprodukuj zvuk samo ako nije već reprodukovan u ovom ciklusu
    if (shouldRing && !hasPlayedSoundInThisCycleRef.current) {
      console.log(`[SmartCountdownDisplay ${componentIdRef.current}] 🎵 PLAYING SOUND (cycle max time: ${maxTimeLeftRef.current}ms)`);
      const audio =
        typeof window !== 'undefined' ? new Audio('/warning.mp3') : null;
      if (audio) {
        audio.currentTime = 0; // reset
        audio.play().catch((err) => {
          console.error(`[SmartCountdownDisplay ${componentIdRef.current}] Error playing sound:`, err);
        });
        hasPlayedSoundInThisCycleRef.current = true; // Označi da je zvuk reprodukovan u ovom ciklusu
        console.log(`[SmartCountdownDisplay ${componentIdRef.current}] ✅ Sound flag set to true`);
      } else {
        console.log(`[SmartCountdownDisplay ${componentIdRef.current}] ⚠️ Audio not available`);
      }
    } else if (shouldRing && hasPlayedSoundInThisCycleRef.current) {
      console.log(`[SmartCountdownDisplay ${componentIdRef.current}] 🔇 Sound already played in this cycle (max time: ${maxTimeLeftRef.current}ms)`);
    }
  }, [shouldRing]);

  return (
    <Text className={active ? activeTextClassName : inactiveTextClassName}>
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