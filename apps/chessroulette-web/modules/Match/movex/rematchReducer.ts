// rematchReducer.ts
import { MovexReducer } from 'movex-core-util';
import { Rematch } from './types';
import { initialRematchState } from './state';
import { MatchActions } from './types'; // ili odakle god ti dolaze akcije

export const rematchReducer: MovexReducer<Rematch, MatchActions> = (
  prev : Rematch = initialRematchState,
  action: MatchActions
): Rematch => {
    console.log('[Rematch Reducer] Action received:', action);
  switch (action.type) {
    case 'play:sendOffer': {
      if (action.payload.offerType === 'rematch') {
        return { rematch: true };
      }
      return prev;
    }

    case 'play:acceptOfferRematch': {
      return { rematch: false };
    }

    default:
      return prev;
  }
};
