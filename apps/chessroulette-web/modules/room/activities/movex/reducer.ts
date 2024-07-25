// The composition of all activity reducers

import * as LearnActivity from '../Learn/movex';
import { initialActivityState } from './state';
import { ActivityActions, ActivityState } from './types';
import * as MeetupActivity from '../Meetup/movex';
import * as PlayActivity from '../Play/movex';
import { composeReducers } from '@xmatter/util-kit';
import * as MatchActivity from '../Match/movex';
import { MovexReducer } from 'movex-core-util';

const composedReducer = composeReducers<ActivityState>(
  LearnActivity.reducer,
  MeetupActivity.reducer,
  PlayActivity.reducer,
  MatchActivity.reducer
);

export const roomActivityReducer: MovexReducer<
  ActivityState,
  ActivityActions
> = (
  state: ActivityState = initialActivityState,
  action: ActivityActions
): ActivityState => composedReducer(state, action);

// TODO: This should be done automatically by composeReducer function :)
roomActivityReducer.$transformState = MatchActivity.reducer.$transformState;
