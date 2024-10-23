import { Action } from 'movex-core-util';
import { PlayActions } from '@app/modules/Match/Play/store';
import { EndedGame, NotEndedGame } from '@app/modules/Game';

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

      // TODO: Change the value of this to "challenger|challengee"
      winner: PlayerId | null;

      // TODO: Rename this to endedGames
      // endedPlays: EndedPlayState[];
      endedGames: EndedGame[];
      gameInPlay: NotEndedGame | null;

      challenger: MatchPlayer;
      challengee: MatchPlayer;
    })
  | null; // TODO: This should not be null, but another status

export type MatchActions = PlayActions | Action<'match:startNewGame'>;
