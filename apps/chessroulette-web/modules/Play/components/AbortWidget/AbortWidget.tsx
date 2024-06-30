import React from 'react';
import { SimpleCountdown } from '../Countdown/SimpleCountdown';
import { QuickConfirmButton } from 'apps/chessroulette-web/components/Button/QuickConfirmButton';

type Props = {
  timer: number;
  onAbort: () => void;
};

export const AbortWidget: React.FC<Props> = (props) => {
  return (
    <div className="flex gap-3">
      <span>{`Game will abort in `}</span>
      <SimpleCountdown timeleft={props.timer} onFinished={props.onAbort} />
      <QuickConfirmButton
        size="xs"
        className="w-full"
        confirmationBgcolor="red"
        confirmationMessage="Are you sure?"
        icon="StopCircleIcon"
        iconKind="solid"
        onClick={props.onAbort}
      >
        Abort Now
      </QuickConfirmButton>
    </div>
  );
};
