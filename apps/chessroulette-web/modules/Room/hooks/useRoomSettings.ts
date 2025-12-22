'use client';

import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { useLearnActivitySettings } from '../activities/Learn';
import { useAichessActivitySettings } from '../activities/Aichess';
import { useLearnAiActivitySettings } from '../activities/LearnAi';
import { ActivityState } from '../activities/movex';
import { invoke } from '@xmatter/util-kit';
import { useMeetupActivitySettings } from '../activities/Meetup/useMeetupActivitySettings';
import { JoinRoomLinkProps } from '../activities/Learn/activitySettings';
import { JoinAichessRoomLinkProps } from '../activities/Aichess/activitySettings';

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
  const aichessActivitySettings = useAichessActivitySettings();
  const learnAiActivitySettings = useLearnAiActivitySettings();

  const joinRoomLinkProps = invoke((): JoinAichessRoomLinkProps => {
    if (activity === 'learn') {
      return learnActivitySettings;
    }
    if (activity === 'aichess') {
      return aichessActivitySettings;
    }
    if (activity === 'ailearn') {
      return learnAiActivitySettings;
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
