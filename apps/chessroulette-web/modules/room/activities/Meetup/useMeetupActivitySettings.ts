'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';

export type MeetupActivitySettings = {
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const useMeetupActivitySettings = (): MeetupActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();

  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    showJoinRoomLink: true,
    joinRoomLinkParams: {
      flipped: '1',
    },
    joinRoomLinkTooltip: 'Invite Friend',
  };
};
