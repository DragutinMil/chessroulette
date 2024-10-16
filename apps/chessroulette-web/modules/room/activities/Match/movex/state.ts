import { MatchActivityState, MatchState } from './types';
import { PlayStore } from '@app/modules/Play';

// export const initialMatchState: MatchActivityState = {

// }
// export const initialOpenEndedMatch: MatchState = {
//   type: 'openEnded',
//   status: 'pending',
//   // timeClass: 'untimed',
//   players: {},
//   completedPlays: [],
//   ongoingPlay: PlayStore.initialPlayState, // Should this be defined like this?
//   rounds: 1,
// };

export const initialMatchActivityState: MatchActivityState = {
  activityType: 'match',
  // activityState: PlayStore.initialPlayState, // TODO: add the match wrapper
  activityState: null,
};
