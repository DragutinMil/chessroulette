import { createContext } from 'react';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { Game, Offer, PlayState, initialPlayState } from '../store';

export type GameActionsContextProps = {
  lastOffer: Offer | undefined;
  gameState: Game;
  offers: PlayState['offers'];
  players: UsersMap | undefined;
  clientUserId: UserId | undefined;
};

export const GameActionsContext = createContext<GameActionsContextProps>({
  lastOffer: undefined,
  gameState: initialPlayState.game,
  players: undefined,
  offers: [],
  clientUserId: undefined,
});
