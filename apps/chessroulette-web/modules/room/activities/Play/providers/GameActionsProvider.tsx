import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameActionsContext,
  GameActionsContextProps,
} from './GameActionsContext';
import { PlayActivityState } from '../movex';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';

type Props = PropsWithChildren & {
  remoteState: PlayActivityState['activityState'];
  participants: UsersMap | undefined;
  clientUserId: UserId;
};

export const GameActionsProvider: React.FC<Props> = ({
  remoteState,
  participants,
  clientUserId,
  children,
}) => {
  const [value, setValue] = useState<GameActionsContextProps>({
    currentActiveOffer: undefined,
    gameState: remoteState.game,
    participants,
    clientUserId,
  });

  useEffect(() => {
    const lastOffer =
      remoteState.offers && remoteState.offers.length > 0
        ? remoteState.offers[remoteState.offers.length - 1]
        : undefined;

    setValue((prev) => ({
      ...prev,
      participants,
      gameState: remoteState.game,
      currentActiveOffer:
        //TODO - maybe improve logic here
        lastOffer && lastOffer.status === 'pending' ? lastOffer : undefined,
    }));
  }, [remoteState, participants]);

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
