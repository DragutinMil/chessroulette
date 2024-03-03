import { ChessFENBoard, FreeBoardHistory } from '@xmatter/util-kit';
import { MeetupActivityState } from './types';

export const initialMeetupActivityState: MeetupActivityState = {
  activityType: 'meetup',
  activityState: {
    game: {
      displayFen: ChessFENBoard.STARTING_FEN,
      arrowsMap: {},
      circlesMap: {},
      notation: {
        history: [],
        focusedIndex: FreeBoardHistory.getStartingIndex(),
        startingFen: ChessFENBoard.STARTING_FEN,
      },
    },
  },
};
