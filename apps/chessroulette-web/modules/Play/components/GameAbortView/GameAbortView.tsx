import React, { useMemo, useState } from 'react';
import { SimpleCountdown } from '../Countdown/SimpleCountdown';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';
import { Button } from 'apps/chessroulette-web/components/Button';
import { Dialog } from 'apps/chessroulette-web/components/Dialog';

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
  const [showModal, setShowModal] = useState(false);
  const displayWarning = useMemo(() => {
    return firstRound
      ? 'If you abort, this match will be canceled and invalid!'
      : 'Be careful. If you Abort, you will lose the whole match!';
  }, [firstRound]);

  return (
    <div className={`flex gap-3 flex-1 justify-between ${className}`}>
      <div className="flex gap-2">
        <span>{`Game aborting in `}</span>
        <SimpleCountdown msleft={timeLeft} onFinished={onAbort} />
      </div>
      {canAbortOnDemand && (
        <div>
          <Button onClick={() => setShowModal(true)}>Abort Now</Button>
        </div>
      )}
      {showModal && (
        <Dialog
          content={
            <div className="flex flex-row justify-center">
              <div>{displayWarning}</div>
            </div>
          }
          title="Are you sure?"
          buttons={[
            {
              children: 'Abort',
              onClick: () => onAbort(),
              type: 'primary',
              bgColor: 'red',
            },
            {
              children: 'Cancel',
              onClick: () => setShowModal(false),
              type: 'primary',
              bgColor: 'blue',
            },
          ]}
          onClose={() => setShowModal(false)}
          modalBG="light"
        />
      )}
      {/*{canAbortOnDemand && (
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
    )}*/}
    </div>
  );
};
