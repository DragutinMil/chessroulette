import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameActionsContext,
  GameActionsContextProps,
} from './GameActionsContext';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { PlayState } from '../store';

type Props = PropsWithChildren & {
  state: PlayState;
  players: UsersMap | undefined;
  clientUserId: UserId;
};

export const GameActionsProvider: React.FC<Props> = ({
  state,
  players,
  clientUserId,
  children,
}) => {
  const [value, setValue] = useState<GameActionsContextProps>({
    lastOffer: undefined,
    gameState: state.game,
    offers: state.offers,
    players,
    clientUserId,
  });

  useEffect(() => {
    const lastOffer = state.offers?.slice(-1)[0];

    setValue((prev) => ({
      ...prev,
      players,
      gameState: state.game,
      offers: state.offers,
      lastOffer,
    }));
  }, [state, players]);

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
