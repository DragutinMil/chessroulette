import React, { PropsWithChildren, useMemo } from 'react';
import { GameActionsContext } from './GameActionsContext';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { Game } from '../store';

export type GameActionsProviderProps = PropsWithChildren & {
  game: Game;
  playerId: UserId;
  players?: UsersMap;
};

export const GameActionsProvider: React.FC<GameActionsProviderProps> = ({
  game,
  players,
  playerId,
  children,
}) => {
  const value = useMemo(
    () => ({
      players,
      playerId,
      game,
      lastOffer: game.offers?.slice(-1)[0],
    }),
    [game, players, playerId]
  );

  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
};
