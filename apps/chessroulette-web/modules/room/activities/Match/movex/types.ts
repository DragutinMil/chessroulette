import { PlayStore } from 'apps/chessroulette-web/modules/Play';
import { Action } from 'movex-core-util';

type PlayerId = string;

export type MatchPlayer = {
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
      rounds?: null; // There is no end so no need for rounds here
      // rounds?: 'unlimited';
    }
) & {
  // Add others
  status: 'pending' | 'ongoing' | 'complete' | 'aborted';
  // players: Record<Player['id'], Player>;
  // maxPlayers: number; // Not needed anymore
  players: {
    white: MatchPlayer;
    black: MatchPlayer;
  };

  // TODO: This is needd but neet to make sure I can set it correctly as I cannot set it in the reducer! but jst with createResource and actions
  // lastUpdateAt: number; // This includes everythin changing in the match: status change, play.game.lastActivityAt update,

  // Change name to "endedPlays" because this can inclde aborted as well
  completedPlays: PlayStore.PlayState[];

  winner: null | PlayerId;

  // timeClass: Game['timeClass'];

  // TODO: Should this always hav a pending game??
  ongoingPlay: PlayStore.PlayState | null;
};

// export type MatchState = PlayStore.PlayState

// export type MatchActivityActivityState = undefined | MatchState;
export type MatchActivityActivityState = null | MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
};

export type MatchActivityActions =
  | PlayStore.PlayActions
  | Action<'match:startNewGame'>;
