import { createContext } from 'react';
import { Offer } from '../movex';

export type GameActionsContextProps =
  | {
      currentActiveOffer: Offer;
    }
  | undefined;

export const GameActionsContext =
  createContext<GameActionsContextProps>(undefined);
