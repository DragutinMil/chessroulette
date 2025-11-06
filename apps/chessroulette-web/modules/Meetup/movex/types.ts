import { MatchActions, MatchState } from '@app/modules/Match/movex';
import { UserId } from '@app/modules/User';
import { Action } from 'movex-core-util';

export type MeetupParticipant = {
  id: string;
  role: 'star' | 'fan';
};

export type MeetupState = {
  participantsById: Record<MeetupParticipant['id'], MeetupParticipant>;
  match: MatchState;
};

export type MeetupActions =
  | MatchActions
  | Action<'meetup:join', { userId: UserId; isStar?: boolean }>;

export type MeetupActivityActions = MeetupActions;

export type OfferCounters = { 
   takeback: Record<UserId, number>; 
   draw: Record<UserId, number>; }
