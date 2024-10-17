'use client';

import { objectOmit } from '@xmatter/util-kit';

// TODO: These 2 should not depend on Play and Learn
import { usePlayActivitySettings } from '../Play/usePlayActivitySettings';
import { JoinRoomLinkProps } from '../Learn/activitySettings';

export type MatchActivitySettings = {
  isBoardFlipped: boolean;
} & JoinRoomLinkProps;

export const useMatchActivitySettings = (): MatchActivitySettings => {
  const playActivitySettings = usePlayActivitySettings();

  return objectOmit(playActivitySettings, ['gameTimeClass']);
};
