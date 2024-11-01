import { Game, GameOffer } from '@app/modules/Game';
import { UserId } from '@app/modules/User2';
import { ChessColor, LongChessColor } from '@xmatter/util-kit';
import { MovexDispatchOf } from 'movex-core-util';
import { PlayActions } from './store';

export type PlayerId = string;

export type PlayerInfo = {
  id: string;
  color: LongChessColor;
  displayName?: string;
};

export type PlayerInfoWithResults = PlayerInfo & { points?: number };

export type PlayersBySide = {
  home: PlayerInfo;
  away: PlayerInfo;
};

export type PlayersByColor = {
  white: PlayerInfo;
  black: PlayerInfo;
};

export type PlayersBySideWithResults = {
  home: PlayerInfoWithResults;
  away: PlayerInfoWithResults;
};

// TODO: These are not needed anymore here are they?
// @depreacate as it doesn't make sense anymore
// The match results should be based on challenger and challengee
// export type Old_Play_Results = {
//   white: number;
//   black: number;
// };

// export type ResultsByPlayerSide = {
//   home: {
//     id: string;
//     points: number;
//   };
//   away: {
//     id: string;
//     points: number;
//   };
// };

export type PlayViewState =
  | ({
      hasGame: true;
      game: Game; // TODO: should this be split in display and commited
      turn: ChessColor;
      playersByColor: PlayersByColor;
      playersBySide: PlayersBySide;
      lastOffer?: GameOffer;
    } & (
      | {
          canUserPlay: true;
          userAsPlayerId: UserId;
        }
      | {
          canUserPlay: false;
          userAsPlayerId?: undefined;
        }
    ))
  | {
      hasGame: false;
      game?: undefined;
      turn?: undefined;
      playersByColor?: undefined;
      playersBySide?: undefined;
      canUserPlay?: false;
      lastOffer?: undefined;
    };
