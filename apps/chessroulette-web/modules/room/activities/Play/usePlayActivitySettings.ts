'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { JoinRoomLinkProps } from '../Learn';
import {
  GameTimeClass,
  gameTimeClassRecord,
} from 'apps/chessroulette-web/modules/Play/types';
import { invoke } from '@xmatter/util-kit';

export type PlayActivitySettings = {
  gameTimeClass: GameTimeClass;
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const usePlayActivitySettings = (): PlayActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const isHost = updateableSearchParams.get('host') === '1';
  const gameTimeClass: GameTimeClass = invoke(() => {
    if (!updateableSearchParams) {
      return 'untimed';
    }

    const gameTimeClass = updateableSearchParams.get('gameTimeClass');
    const parser = gameTimeClassRecord.safeParse(gameTimeClass);

    return parser.success ? parser.data : 'untimed';
  });

  return {
    isBoardFlipped: updateableSearchParams.get('flipped') === '1',
    joinRoomLinkTooltip: 'Invite Player',
    gameTimeClass,
    showJoinRoomLink: isHost,
    joinRoomLinkParams: {
      flipped: '1',
    },
  };
};
