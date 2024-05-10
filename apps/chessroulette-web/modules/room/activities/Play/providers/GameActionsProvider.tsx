import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameActionsContext,
  GameActionsContextProps,
} from './GameActionsContext';
import { PlayActivityState } from '../movex';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';

type Props = PropsWithChildren & {
  remoteState: PlayActivityState['activityState'];
  players: UsersMap | undefined;
  clientUserId: UserId;
};

export const GameActionsProvider: React.FC<Props> = ({
  remoteState,
  players,
  clientUserId,
  children,
}) => {
  const [value, setValue] = useState<GameActionsContextProps>({
    currentActiveOffer: undefined,
    gameState: remoteState.game,
    players,
    clientUserId,
  });

  useEffect(() => {
    console.log('remoteState', remoteState);

    const lastOffer = remoteState.offers?.slice(-1)[0];

    setValue((prev) => ({
      ...prev,
      players,
      gameState: remoteState.game,
      currentActiveOffer:
        //TODO - maybe improve logic here
        lastOffer && lastOffer.status === 'pending' ? lastOffer : undefined,
    }));
  }, [remoteState, players]);

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
