import { LongChessColor } from '@xmatter/util-kit';

export type PlayerId = string;

export type PlayerInfo = {
  id: string;
  color: LongChessColor;
  displayName?: string;
};

export type PlayersBySide = {
  home: PlayerInfo;
  away: PlayerInfo;
};

// TODO: These are not needed anymore here are they?
// @depreacate as it doesn't make sense anymore
// The match results should be based on challenger and challengee
export type Old_Play_Results = {
  white: number;
  black: number;
};
