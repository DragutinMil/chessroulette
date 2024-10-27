import { MeetupActivityState } from './types';

export const initialMeetupActivityState: MeetupActivityState = {
  activityType: 'meetup',
  activityState: {
    match: null,
    // game: {
    //   arrowsMap: {},
    //   circlesMap: {},
    //   pgn: '',
    //   orientation: 'w',
    // },
  },
};
