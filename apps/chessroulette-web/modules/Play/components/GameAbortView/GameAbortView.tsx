import React from 'react';
import { SimpleCountdown } from '../Countdown/SimpleCountdown';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';

export type GameAbortViewProps = {
  timeLeft: number;
  onAbort: () => void;
  canAbortOnDemand: boolean;
  className?: string;
};

export const GameAbortView: React.FC<GameAbortViewProps> = ({
  timeLeft,
  onAbort,
  canAbortOnDemand,
  className,
}) => (
  <div className={`flex gap-3 flex-1 justify-between ${className}`}>
    <div className="flex gap-2">
      <span>{`Game aborting in `}</span>
      <SimpleCountdown timeleft={timeLeft} onFinished={onAbort} />
    </div>
    {canAbortOnDemand && (
      <div>
        <QuickConfirmButton
          size="xs"
          className="w-full"
          confirmationBgcolor="red"
          confirmationMessage="Are you sure?"
          icon="StopCircleIcon"
          iconKind="solid"
          onClick={onAbort}
          bgColor="red"
        >
          Abort Now
        </QuickConfirmButton>
      </div>
    )}
  </div>
);
