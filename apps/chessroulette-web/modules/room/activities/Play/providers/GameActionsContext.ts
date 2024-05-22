import { createContext } from 'react';
import { Offer, PlayActivityState, initialPlayActivityState } from '../movex';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';

export type GameActionsContextProps = {
  lastOffer: Offer | undefined;
  gameState: PlayActivityState['activityState']['game'];
  offers: PlayActivityState['activityState']['offers'];
  players: UsersMap | undefined;
  clientUserId: UserId | undefined;
};

export const GameActionsContext = createContext<GameActionsContextProps>({
  lastOffer: undefined,
  gameState: initialPlayActivityState['activityState']['game'],
  players: undefined,
  offers: [],
  clientUserId: undefined,
});
