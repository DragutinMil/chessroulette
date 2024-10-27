import { MatchActions, MatchState } from '@app/modules/Match/movex';

export type MeetupActivityState = {
  activityType: 'meetup';
  activityState: {
    match: MatchState;
  };
};

export type MeetupActivityActions = MatchActions;
