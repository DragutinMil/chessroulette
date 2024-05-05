import { createContext } from 'react';
import { Offer, PlayActivityState, initialPlayActivityState } from '../movex';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';

export type GameActionsContextProps = {
  currentActiveOffer: Offer | undefined;
  gameState: PlayActivityState['activityState']['game'];
  participants: UsersMap | undefined;
  clientUserId: UserId | undefined;
};

export const GameActionsContext = createContext<GameActionsContextProps>({
  currentActiveOffer: undefined,
  gameState: initialPlayActivityState['activityState']['game'],
  participants: undefined,
  clientUserId: undefined,
});
