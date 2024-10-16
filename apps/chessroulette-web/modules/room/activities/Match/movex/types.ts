import { Action } from 'movex-core-util';
import {
  PlayState,
  EndedPlayState,
  PlayActions,
} from '@app/modules/Play/movex';

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
    }
) & {
  // Add other statuses if needed
  status: 'pending' | 'ongoing' | 'complete' | 'aborted';
  players: {
    white: MatchPlayer;
    black: MatchPlayer;
  };

  endedPlays: EndedPlayState[];

  winner: null | PlayerId;

  // TODO: Should this always hav a pending game??
  ongoingPlay: PlayState | null;
};

export type MatchActivityActivityState = null | MatchState;

export type MatchActivityState = {
  activityType: 'match';
  activityState: MatchActivityActivityState;
};

export type MatchActivityActions = PlayActions | Action<'match:startNewGame'>;
