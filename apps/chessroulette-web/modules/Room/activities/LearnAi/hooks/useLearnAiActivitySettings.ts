'use client';

import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { LearnAiActivitySettings } from '../activitySettings';

export const useLearnAiActivitySettings = (): LearnAiActivitySettings => {
  const updateableSearchParams = useUpdateableSearchParams();
  const isInstructor = updateableSearchParams.get('instructor') === '1';

  return {
    isInstructor,
    canFlipBoard:
      isInstructor || updateableSearchParams.get('canFlipBoard') === '1',
    isBoardFlipped:
      !isInstructor || updateableSearchParams.get('flipped') === '1',
    canEditBoard:
      isInstructor || updateableSearchParams.get('canEditBoard') === '1',
    canMakeInvalidMoves:
      isInstructor || updateableSearchParams.get('canMakeInvalidMoves') === '1',
    canImport: isInstructor || updateableSearchParams.get('canImport') === '1',
    showJoinRoomLink: isInstructor,
    showEngine: isInstructor && updateableSearchParams.get('engine') === '1',
    joinRoomLinkParams: {},
    joinRoomLinkTooltip: 'Invite Student',
  };
};
