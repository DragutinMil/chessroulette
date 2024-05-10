import { createContext } from 'react';
import { Offer, PlayActivityState, initialPlayActivityState } from '../movex';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';

export type GameActionsContextProps = {
  currentActiveOffer: Offer | undefined;
  lastOffer: Offer | undefined;
  gameState: PlayActivityState['activityState']['game'];
  players: UsersMap | undefined;
  clientUserId: UserId | undefined;
};

export const GameActionsContext = createContext<GameActionsContextProps>({
  currentActiveOffer: undefined,
  lastOffer: undefined,
  gameState: initialPlayActivityState['activityState']['game'],
  players: undefined,
  clientUserId: undefined,
});
