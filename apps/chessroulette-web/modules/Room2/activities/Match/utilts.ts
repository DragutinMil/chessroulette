import { MatchState } from '@app/modules/Match/movex';
import { UsersMap } from '@app/modules/User2';

export const populateMatchWithParticipants = (
  match: NonNullable<MatchState>,
  participants: UsersMap
) => ({
  ...match,
  challenger: {
    ...match.challenger,
    ...participants[match.challenger.id],
  },
  challengee: {
    ...match.challengee,
    ...participants[match.challengee.id],
  },
});
