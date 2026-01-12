import React from 'react';
import { ConfirmButton, ConfirmButtonProps } from '@app/components/Button';
import { SmartCountdown } from '@app/components/SmartCountdown';

export type GameAbortViewProps = {
  timeLeft: number;
  canAbortOnDemand: boolean;
  confirmContent: ConfirmButtonProps['confirmModalContent'];
  onAbort: () => void;
  onRefreshTimeLeft: () => void;
  className?: string;
};

export const GameAbort: React.FC<GameAbortViewProps> = ({
  timeLeft,
  canAbortOnDemand,
  className,
  confirmContent,
  onAbort,
  onRefreshTimeLeft,
}) => (
  <div
    className={` flex gap-3 flex-row flex-1  justify-between   ${className}`}
  >
    <div className="flex gap-2 align-center  ">
      <span className="whitespace-nowrap pt-1   flex text-sm  md:text-md">{`Game aborting in `}</span>
      <SmartCountdown
        msLeft={timeLeft}
        className="text-sm md:text-md pt-1"
        onFinished={onAbort}
        onRefreshMsLeft={onRefreshTimeLeft}
        isActive
        activeTextClassName="text-red-600 font-bold "
      />
    </div>
    {canAbortOnDemand && (
      <ConfirmButton
        bgColor="red"
        size="sm"
        onClick={onAbort}
        icon="StopCircleIcon"
        iconKind="solid"
        confirmModalContent={confirmContent}
        confirmModalTitle="Are you sure?"
        confirmModalAgreeButtonBgColor="red"
      >
        Abort Now
      </ConfirmButton>
    )}
  </div>
);
