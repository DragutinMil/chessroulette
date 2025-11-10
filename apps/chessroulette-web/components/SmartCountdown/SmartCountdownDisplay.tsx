import { Text } from '@app/components/Text';

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
  activeTextClassName = 'text-white    py-1 px-3 rounded-md   w-full    shadow-lg bg-slate-700 ',
  inactiveTextClassName = 'relative text-slate-400  py-1 px-3  rounded-md  w-full  backdrop-blur-lg shadow-lg',
}: SmartCountdownDisplayProps) => {
  //51 65 85
  if (timeLeft <= 0) {
    return (
      <Text className="text-red-500 relative   py-1 px-3  rounded-md   w-full  backdrop-blur-lg shadow-lg ">
        00:00
      </Text>
    );
  }

  const shouldAlert = Number(major) < 1 && Number(minor) < 30;

  return (
    <Text className={active ? activeTextClassName : inactiveTextClassName}>
      <Text className="font-bold">{major}</Text>
      <Text>:</Text>
      <Text
        className={`font-thin ${
          shouldAlert ? 'text-red-500 animate-pulse' : 'text'
        }`}
      >
        {minor}
      </Text>
    </Text>
  );
};
