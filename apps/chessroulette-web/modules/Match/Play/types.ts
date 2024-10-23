import { Game, GameOffer } from '@app/modules/Game';
import { ChessColor, LongChessColor } from '@xmatter/util-kit';

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

export type PlayersByColor = {
  white: PlayerInfo;
  black: PlayerInfo;
};

// TODO: These are not needed anymore here are they?
// @depreacate as it doesn't make sense anymore
// The match results should be based on challenger and challengee
export type Old_Play_Results = {
  white: number;
  black: number;
};

export type Play = {
  game: Game; // TODO: should this be split in display and commited
  turn: ChessColor;
  playersByColor: PlayersByColor;
  playersBySide: PlayersBySide;
  canUserPlay: boolean;
  lastOffer?: GameOffer;
};
