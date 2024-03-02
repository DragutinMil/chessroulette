'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';

export type LearnActivitySettings = {
  theme: string | undefined; // TODO: this can be more specific
};

/**
 * This contains all of the room specific settings (search parans, user persisted or local storage)
 *
 * @returns
 */
export const useRoomSettings = (): LearnActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const theme = updateableSearchParams.get('theme') || undefined;

  return {
    theme,
  };
};
