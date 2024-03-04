'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { useLearnActivitySettings } from '../activities/Learn';
import { ActivityState } from '../activities/movex';

export type LearnActivitySettings = {
  theme: string | undefined; // TODO: this can be more specific
  showJoinRoomLink: boolean;
};

/**
 * This contains all of the room specific settings (search params, user persisted or local storage)
 *
 * @returns
 */
export const useRoomSettings = (
  activity: ActivityState['activityType']
): LearnActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const learnActivitySettings = useLearnActivitySettings();

  return {
    theme: updateableSearchParams.get('theme') || undefined,
    showJoinRoomLink: {
      learn: learnActivitySettings.showJoinRoomLink,
      none: false,
      meetup: true, // If this needs to be more specific, add a useMeetypActivitySettings() and define it there
    }[activity],
  };
};
