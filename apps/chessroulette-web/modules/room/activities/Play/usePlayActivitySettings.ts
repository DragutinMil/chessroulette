'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';
import { GameType, gameTypeRecord } from './types';

export type PlayActivitySettings = {
  gameType: GameType;
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const usePlayActivitySettings = (): PlayActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const isHost = updateableSearchParams.get('host') === '1';

  const getGameType = (): GameType => {
    if (!updateableSearchParams) {
      return 'untimed';
    }

    const gameType = updateableSearchParams.get('gameType');
    const parser = gameTypeRecord.safeParse(gameType);
    return parser.success ? parser.data : 'untimed';
  };
  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    joinRoomLinkTooltip: 'Invite Player',
    gameType: getGameType(),
    showJoinRoomLink: isHost,
    joinRoomLinkParams: {
      flipped: '1',
    },
  };
};
