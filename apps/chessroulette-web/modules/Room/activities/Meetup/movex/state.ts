import { initialMeetupState } from '@app/modules/Meetup/movex';
import { MeetupActivityState } from './types';

export const initialMeetupActivityState: MeetupActivityState = {
  activityType: 'meetup',
  activityState: initialMeetupState,
};
