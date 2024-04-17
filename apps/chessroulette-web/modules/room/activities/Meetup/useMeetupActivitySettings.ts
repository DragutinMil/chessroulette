'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';

export type MeetupActivitySettings = {
  isBoardFlipped: boolean;
  canResetBoard: boolean;
} & JoinRoomLinkProps;

// This is more for linkup (outpost specific). Might need to change from meetup to linkup
// if I wnt a more basic Meetup functionality
export const useMeetupActivitySettings = (): MeetupActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const isStar = updateableSearchParams.get('star') === '1';

  return {
    isBoardFlipped: !isStar,
    showJoinRoomLink: isStar,
    joinRoomLinkParams: {},
    canResetBoard: isStar,
    joinRoomLinkTooltip: 'Invite Fan',
  };
};
