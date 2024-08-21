'use client';

import { objectOmit } from '@xmatter/util-kit';
import { usePlayActivitySettings } from '../../Play/usePlayActivitySettings';
import { JoinRoomLinkProps } from '../../Learn/activitySettings';

export type MatchActivitySettings = {
  // gameTimeClass: GameTimeClass;
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const useMatchActivitySettings = (): MatchActivitySettings => {
  const playActivitySettings = usePlayActivitySettings();

  return objectOmit(playActivitySettings, ['gameTimeClass']);
};
