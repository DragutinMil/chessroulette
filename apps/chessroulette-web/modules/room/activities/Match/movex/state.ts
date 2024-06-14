import { MatchActivityState, MatchState } from './types';
import { PlayStore } from 'apps/chessroulette-web/modules/Play';

// export const initialMatchState: MatchActivityState = {

// }
export const initialFriendlyMatch: MatchState = {
  type: 'friendly',
  maxPlayers: 2,
  status: 'pending',
  // timeClass: 'untimed',
  players: {},
  plays: [],
  currentPlay: PlayStore.initialPlayState, // Should this be defined like this?
  rounds: 1,
};

export const initialMatchActivityState: MatchActivityState = {
  activityType: 'match',
  // activityState: PlayStore.initialPlayState, // TODO: add the match wrapper
  activityState: initialFriendlyMatch,
};
