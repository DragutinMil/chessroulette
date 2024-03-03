'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';

export type LearnActivitySettings = {
  isInstructor: boolean;
  canFlipBoard: boolean;
  isBoardFlipped: boolean;
  canEditBoard: boolean;
  canMakeInvalidMoves: boolean;
  canImport: boolean;
};

export const useLearnActivitySettings = (): LearnActivitySettings => {
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
  };
};
