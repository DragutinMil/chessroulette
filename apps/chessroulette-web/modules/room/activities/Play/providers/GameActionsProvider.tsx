import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameActionsContext,
  GameActionsContextProps,
} from './GameActionsContext';
import { PlayActivityState } from '../movex';

type Props = PropsWithChildren & {
  remoteState: PlayActivityState['activityState'];
};

export const GameActionsProvider: React.FC<Props> = ({
  remoteState,
  children,
}) => {
  const [value, setValue] = useState<GameActionsContextProps>(undefined);

  useEffect(() => {
    const lastOffer =
      remoteState.offers && remoteState.offers.length > 0
        ? remoteState.offers[remoteState.offers.length - 1]
        : undefined;

    console.log('last offer in Provider -> ', lastOffer);

    if (lastOffer && lastOffer.status === 'pending') {
      setValue({
        currentActiveOffer: lastOffer,
      });
    }
    if (lastOffer && lastOffer.status !== 'pending') {
      setValue(undefined);
    }
  }, [remoteState.offers]);

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
