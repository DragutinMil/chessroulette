import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { Action } from 'movex-core-util';

type PlayerId = string;

export type Player = {
  id: PlayerId;
  displayName?: string;
  score: number;
};

export type MatchState = (
  | {
      type: 'bestOf';
      rounds: number; // Ensure these can only be odd numbers
    }
  | {
      type: 'openEnded';
      rounds?: undefined; // There is no end so no need for rounds here
      // rounds?: 'unlimited';
    }
) & {
  // Add others
  status: 'pending' | 'ongoing' | 'complete';
  // players: Record<Player['id'], Player>;
  // maxPlayers: number; // Not needed anymore
  players: {
    white: Player;
    black: Player;
  };
  completedPlays: PlayStore.PlayState[];

  winner: undefined | PlayerId;

  // timeClass: Game['timeClass'];

  // TODO: Should this always hav a pending game??
  ongoingPlay: PlayStore.PlayState;
};

// export type MatchState = PlayStore.PlayState

// export type MatchActivityActivityState = undefined | MatchState;
export type MatchActivityActivityState = undefined | MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
};

export type MatchActivityActions =
  | PlayStore.PlayActions
  | Action<'match:startNewGame'>;
