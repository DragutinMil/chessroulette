'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';

export type PlayActivitySettings = {
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const usePlayActivitySettings = (): PlayActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    showJoinRoomLink: true,
    joinRoomLinkParams: {
      flipped: '1',
    },
  };
};
