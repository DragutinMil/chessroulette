'use client';

import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { DailyLessonActivitySettings } from '../activitySettings';

export const useDailyLessonActivitySettings =
  (): DailyLessonActivitySettings => {
    const updateableSearchParams = useUpdateableSearchParams();
    const isInstructor = updateableSearchParams.get('instructor') === '1';

    return {
      isInstructor,
      canFlipBoard: true,
      isBoardFlipped:
        !isInstructor || updateableSearchParams.get('flipped') === '1',
      canEditBoard:
        isInstructor || updateableSearchParams.get('canEditBoard') === '1',
      canMakeInvalidMoves:
        isInstructor ||
        updateableSearchParams.get('canMakeInvalidMoves') === '1',
      canImport:
        isInstructor || updateableSearchParams.get('canImport') === '1',
      showJoinRoomLink: isInstructor,
      showEngine: isInstructor && updateableSearchParams.get('engine') === '1',
      joinRoomLinkParams: {},
      joinRoomLinkTooltip: 'Invite Student',
    };
  };
