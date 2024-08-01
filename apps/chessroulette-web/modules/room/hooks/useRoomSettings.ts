'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import {
  JoinRoomLinkProps,
  useLearnActivitySettings,
} from '../activities/Learn';
import { ActivityState } from '../activities/movex';
import { invoke } from '@xmatter/util-kit';
import { useMeetupActivitySettings } from '../activities/Meetup/useMeetupActivitySettings';
import { usePlayActivitySettings } from '../activities/Play/usePlayActivitySettings';

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
  const playActivitySettings = usePlayActivitySettings();

  const joinRoomLinkProps = invoke((): JoinRoomLinkProps => {
    if (activity === 'learn') {
      return learnActivitySettings;
    }

    if (activity === 'meetup') {
      // This can come from a specific useMeetupActivitySettings
      return meetupActivitySettings;
    }

    if (activity === 'play') {
      // Same as above, can come from usePlayActivitySettings
      return playActivitySettings;
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
