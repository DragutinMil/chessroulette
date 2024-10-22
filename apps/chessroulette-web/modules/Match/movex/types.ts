import { Action } from 'movex-core-util';
import {
  PlayState,
  EndedPlayState,
  PlayActions,
} from '@app/modules/Match/Play/movex';

type PlayerId = string;

export type MatchPlayer = {
  id: PlayerId;
  points: number;

  // Maybe this needs to come only on the client? In a MatchPlayerDisplay, but not be part of movex
  displayName?: string;
};

export type MatchPlayers = {
  white: MatchPlayer;
  black: MatchPlayer;
};

export type MatchState =
  | ((
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

      // @deprecate in favor of challenger|challengee
      players: MatchPlayers;

      endedPlays: EndedPlayState[];

      winner: null | PlayerId;

      // TODO: Should this always have a pending game??
      ongoingPlay: PlayState | null;

      challenger: MatchPlayer;
      challengee: MatchPlayer;
    })
  | null; // TODO: This should not be null, but another status

export type MatchActions = PlayActions | Action<'match:startNewGame'>;
