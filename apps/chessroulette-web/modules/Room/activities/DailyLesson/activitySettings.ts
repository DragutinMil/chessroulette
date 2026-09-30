export type JoinDailyLessonRoomLinkProps =
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

export type DailyLessonActivitySettings = {
  isInstructor: boolean;
  canFlipBoard: boolean;
  isBoardFlipped: boolean;
  canEditBoard: boolean;
  canMakeInvalidMoves: boolean;
  canImport: boolean;
  showEngine: boolean;
} & JoinDailyLessonRoomLinkProps;
