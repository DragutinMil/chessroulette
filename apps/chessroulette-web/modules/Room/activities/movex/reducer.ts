import { composeReducers } from '@app/lib/util';
import * as LearnActivity from '../Learn/movex';
import * as AichessActivity from '../Aichess/movex';
import * as MeetupActivity from '../Meetup/movex';
import * as MatchActivity from '../Match/movex';
import * as ChessaiActivity from '../Chessai/movex';

export const roomActivityReducer = composeReducers(
  LearnActivity.reducer,
  MeetupActivity.reducer,
  MatchActivity.reducer,
  AichessActivity.reducer,
  ChessaiActivity.reducer,
);
