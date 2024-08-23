import React from 'react';
import {
  ConfirmButton,
  ConfirmButtonProps,
} from 'apps/chessroulette-web/components/Button/ConfirmButton';
import { SmartCountdown } from 'apps/chessroulette-web/components/SmartCountdown';

export type GameAbortViewProps = {
  timeLeft: number;
  onAbort: () => void;
  onRefreshTimeLeft: () => void;
  canAbortOnDemand: boolean;
  confirmContent: ConfirmButtonProps['confirmModalContent'];
  className?: string;
};

export const GameAbortView: React.FC<GameAbortViewProps> = ({
  timeLeft,
  onAbort,
  onRefreshTimeLeft,
  canAbortOnDemand,
  className,
  confirmContent,
}) => (
  <div className={`flex gap-3 flex-1 justify-between ${className}`}>
    <div className="flex gap-2">
      <span>{`Game aborting in `}</span>
      <SmartCountdown
        msLeft={timeLeft}
        onFinished={onAbort}
        onRefreshMsLeft={onRefreshTimeLeft}
        isActive
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
