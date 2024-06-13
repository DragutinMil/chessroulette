import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { Action } from 'movex-core-util';

export type Player = {
  id: string;
  displayName?: string;
};

export type MatchState = (
  | {
      type: 'bestOf';
      rounds: 1 | 3 | 4 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19 | 21; // Can add more
    }
  | {
      type: 'friendly'; // This is a regular Play
      rounds?: 'unlimited';
    }
) & {
  // Add others
  maxPlayers: number;
  status: 'pending' | 'ongoing' | 'completed';
  players: Record<Player['id'], Player>;
  plays: PlayStore.PlayState[];

  // TODO: Should this always hav a pending game??
  currentPlay: PlayStore.PlayState;
};

// export type MatchState = PlayStore.PlayState

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchState;
};

export type MatchActivityActions = PlayStore.PlayActions;
