import { MeetupActivityState } from './types';

export const initialMeetupActivityState: MeetupActivityState = {
  activityType: 'meetup',
  activityState: {
    game: {
      arrowsMap: {},
      circlesMap: {},
      pgn: '',
      orientation: 'w',
    },
  },
};
