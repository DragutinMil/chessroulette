import { createContext } from 'react';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { Game, Offer, PlayState, initialPlayState } from '../store';

export type GameActionsContextProps = {
  lastOffer: Offer | undefined;
  game: Game;
  offers: PlayState['offers'];
  players: UsersMap | undefined;
  playerId: UserId | undefined;
};

export const GameActionsContext = createContext<GameActionsContextProps>({
  lastOffer: undefined,
  game: initialPlayState.game,
  players: undefined,
  offers: [],
  playerId: undefined,
});
