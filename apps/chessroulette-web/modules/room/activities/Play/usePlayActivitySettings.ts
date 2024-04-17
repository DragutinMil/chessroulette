'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';
import { GameType } from './types';

export type PlayActivitySettings = {
  gameType: GameType;
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const usePlayActivitySettings = (): PlayActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    //TODO - maybe improve this as it's not perfectly type safe
    gameType: (updateableSearchParams.get('gameType') as GameType) || 'untimed',
    showJoinRoomLink: true,
    joinRoomLinkParams: {
      flipped: '1',
    },
  };
};
