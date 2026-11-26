import React, { useState } from 'react';
import { Button } from '@app/components/Button';
import { Dialog } from '@app/components/Dialog';
import { SmartCountdown } from '@app/components/SmartCountdown';

export type GameAbortViewProps = {
  canAbortOnDemand: boolean;
  confirmContent: React.ReactNode;
  onAbort: () => void;
  onRefreshTimeLeft: () => void;
  className?: string;
  timeLeft?: number;
};

// Potvrda za abort koristi isti Dialog kao "Match Aborted", da izgledaju isto.
// Namerno bez GoogleAd-a. ConfirmButton se ovde vise ne koristi, ostaje netaknut za ostala mesta.
export const GameAbort: React.FC<GameAbortViewProps> = ({
  canAbortOnDemand,
  className,
  confirmContent,
  onAbort,
  onRefreshTimeLeft,
  timeLeft,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      className={` flex gap-3 flex-row flex-1  justify-between   ${className}`}
    >
      <div className="flex gap-2 align-center  ">
        <span className="whitespace-nowrap pt-1   flex text-sm  md:text-md">{`Game aborting in `}</span>
        <SmartCountdown
          msLeft={timeLeft ?? 2000}
          className="text-sm md:text-md pt-1"
          onFinished={() => {
            setShowConfirm(false);
            onAbort();
          }}
          onRefreshMsLeft={onRefreshTimeLeft}
          isActive
          activeTextClassName="text-red-600 font-bold "
        />
      </div>
      {/* {canAbortOnDemand && ( */}
      <Button
        bgColor="red"
        size="sm"
        icon="StopCircleIcon"
        iconKind="solid"
        onClick={() => setShowConfirm(true)}
      >
        Abort Now
      </Button>
      {/* )} */}

      {showConfirm && (
        <Dialog
          title="Abort this match?"
          content={confirmContent}
          buttons={[
            {
              children: 'Keep playing',
              bgColor: 'green',
              onClick: () => setShowConfirm(false),
            },
            {
              children: 'Abort',
              bgColor: 'red',
              onClick: () => {
                setShowConfirm(false);
                onAbort();
              },
            },
          ]}
        />
      )}
    </div>
  );
};
