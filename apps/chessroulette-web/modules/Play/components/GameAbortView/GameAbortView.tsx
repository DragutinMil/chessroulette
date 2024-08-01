import React, { useMemo } from 'react';
import { SimpleCountdown } from '../Countdown/SimpleCountdown';
import { ConfirmButton } from 'apps/chessroulette-web/components/Button/ConfirmButton';

export type GameAbortViewProps = {
  timeLeft: number;
  onAbort: () => void;
  canAbortOnDemand: boolean;
  className?: string;
  firstRound: boolean;
};

export const GameAbortView: React.FC<GameAbortViewProps> = ({
  timeLeft,
  onAbort,
  canAbortOnDemand,
  className,
  firstRound,
}) => {
  const displayWarning = useMemo(
    () =>
      firstRound
        ? 'If you abort, this match will be canceled and invalid!'
        : 'Be careful. If you Abort, you will lose the whole match!',
    [firstRound]
  );

  return (
    <div className={`flex gap-3 flex-1 justify-between ${className}`}>
      <div className="flex gap-2">
        <span>{`Game aborting in `}</span>
        <SimpleCountdown msleft={timeLeft} onFinished={onAbort} />
      </div>
      {canAbortOnDemand && (
        <ConfirmButton
          bgColor="red"
          size="sm"
          onClick={onAbort}
          icon="StopCircleIcon"
          iconKind="solid"
          confirmModalContent={
            <div className="flex flex-row justify-center">
              <div>{displayWarning}</div>
            </div>
          }
          confirmModalTitle="Are you sure?"
          confirmModalAgreeButtonBgColor="red"
        >
          Abort Now
        </ConfirmButton>
      )}
    </div>
  );
};
