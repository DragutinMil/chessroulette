import * as LearnActivity from '../Learn/movex';
import * as MeetupActivity from '../Meetup/movex';
import * as PlayActivity from '../Play/movex';
import * as MatchActivity from '../Match/movex';
import { composeReducers } from '@app/lib/util';

export const roomActivityReducer = composeReducers(
  LearnActivity.reducer,
  MeetupActivity.reducer,
  PlayActivity.reducer,
  MatchActivity.reducer
);
