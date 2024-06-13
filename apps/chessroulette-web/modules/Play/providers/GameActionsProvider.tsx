import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  GameActionsContext,
  GameActionsContextProps,
} from './GameActionsContext';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { PlayState } from '../store';

export type GameActionsProviderProps = PropsWithChildren & {
  state: PlayState;
  playerId: UserId;
  players?: UsersMap;
};

export const GameActionsProvider: React.FC<GameActionsProviderProps> = ({
  state,
  players,
  playerId,
  children,
}) => {
  const [value, setValue] = useState<GameActionsContextProps>({
    lastOffer: undefined,
    game: state.game,
    players,
    playerId,
  });

  useEffect(() => {
    const lastOffer = state.game.offers?.slice(-1)[0];

    setValue((prev) => ({
      ...prev,
      players,
      game: state.game,
      lastOffer,
    }));
  }, [state, players]);

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
