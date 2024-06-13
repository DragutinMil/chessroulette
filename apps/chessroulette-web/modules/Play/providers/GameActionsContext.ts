import { createContext } from 'react';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { Game, GameOffer, PlayState, initialPlayState } from '../store';

export type GameActionsContextProps = {
  lastOffer: GameOffer | undefined;
  game: Game;
  offers: PlayState['gameOffers'];
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
