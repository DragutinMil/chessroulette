'use client';

import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';

export type JoinRoomLinkProps =
  | {
      showJoinRoomLink: true;
      joinRoomLinkParams: Record<string, string>;
      joinRoomLinkTooltip: string;
    }
  | {
      showJoinRoomLink: false;
      joinRoomLinkParams?: {} | undefined;
      joinRoomLinkTooltip?: string | undefined;
    };

export type LearnActivitySettings = {
  isInstructor: boolean;
  canFlipBoard: boolean;
  isBoardFlipped: boolean;
  canEditBoard: boolean;
  canMakeInvalidMoves: boolean;
  canImport: boolean;
} & JoinRoomLinkProps;

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
    showJoinRoomLink: isInstructor,
    joinRoomLinkParams: {},
    joinRoomLinkTooltip: 'Invite Student',
  };
};
