export type JoinLearnAiRoomLinkProps =
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

export type LearnAiActivitySettings = {
  isInstructor: boolean;
  canFlipBoard: boolean;
  isBoardFlipped: boolean;
  canEditBoard: boolean;
  canMakeInvalidMoves: boolean;
  canImport: boolean;
  showEngine: boolean;
} & JoinLearnAiRoomLinkProps;
