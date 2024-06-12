'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';
import {
  GameType,
  gameTypeRecord,
} from 'apps/chessroulette-web/modules/Play/types';
import { invoke } from '@xmatter/util-kit';

export type PlayActivitySettings = {
  gameType: GameType;
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const usePlayActivitySettings = (): PlayActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const isHost = updateableSearchParams.get('host') === '1';
  const gameType: GameType = invoke(() => {
    if (!updateableSearchParams) {
      return 'untimed';
    }

    const gameType = updateableSearchParams.get('gameType');
    const parser = gameTypeRecord.safeParse(gameType);

    return parser.success ? parser.data : 'untimed';
  });

  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    joinRoomLinkTooltip: 'Invite Player',
    gameType,
    showJoinRoomLink: isHost,
    joinRoomLinkParams: {
      flipped: '1',
    },
  };
};
