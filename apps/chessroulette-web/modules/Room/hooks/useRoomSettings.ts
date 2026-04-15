'use client';

import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { useLearnActivitySettings } from '../activities/Learn';
import { usePuzzleActivitySettings } from '../activities/Puzzle';
import { useReviewActivitySettings } from '../activities/Review';
import { useLearnAiActivitySettings } from '../activities/LearnAi';
import { ActivityState } from '../activities/movex';
import { invoke } from '@xmatter/util-kit';
import { useMeetupActivitySettings } from '../activities/Meetup/useMeetupActivitySettings';
import { JoinRoomLinkProps } from '../activities/Learn/activitySettings';

export type RoomSettings = {
  theme: string | undefined; // TODO: this can be more specific
} & JoinRoomLinkProps;

/**
 * This contains all of the room specific settings (search params, user persisted or local storage)
 *
 * @returns
 */
export const useRoomSettings = (
  activity: ActivityState['activityType']
): RoomSettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const learnActivitySettings = useLearnActivitySettings();
  const meetupActivitySettings = useMeetupActivitySettings();
  const learnAiActivitySettings = useLearnAiActivitySettings();
  const puzzleActivitySettings = usePuzzleActivitySettings();
  const reviewActivitySettings = useReviewActivitySettings();

  const joinRoomLinkProps = invoke((): JoinRoomLinkProps => {
    if (activity === 'learn') {
      return learnActivitySettings;
    }

    if (activity === 'ailearn') {
      return learnAiActivitySettings;
    }
    if (activity === 'puzzle') {
      return puzzleActivitySettings;
    }
    if (activity === 'review') {
      return reviewActivitySettings;
    }

    if (activity === 'meetup') {
      // This can come from a specific useMeetupActivitySettings
      return meetupActivitySettings;
    }

    return {
      showJoinRoomLink: false,
    };
  });

  return {
    theme: updateableSearchParams.get('theme') || undefined,
    ...joinRoomLinkProps,
  };
};
