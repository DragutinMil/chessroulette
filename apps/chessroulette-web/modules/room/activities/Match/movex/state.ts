import { MatchActivityState } from './types';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';

export const initialMatchActivityState: MatchActivityState = {
  activityType: 'match',
  activityState: PlayStore.initialPlayState, // TODO: add the match wrapper
};
