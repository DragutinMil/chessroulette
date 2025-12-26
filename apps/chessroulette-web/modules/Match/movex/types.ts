import { Action } from 'movex-core-util';
import { PlayActions } from '@app/modules/Match/Play/store';
import { EndedGame, NotEndedGame } from '@app/modules/Game';
import { User, UserId } from '@app/modules/User';

type PlayerId = string;

export type MatchPlayer = {
  id: PlayerId;
  points: number;
  // Maybe this needs to come only on the client? In a MatchPlayerDisplay, but not be part of movex
  displayName?: string;
  isChatEnabled?: boolean; // Add this field
};
export type GameOffer = {
  // TODO: this should not be byPlayer but byColor, since inside the Game there is no notion of player but just of color
  byPlayer: User['id'];

  //TODO - probably need toParticipant as well, but not sure how to get it now
  type: 'takeback' | 'draw' | 'rematch';
  status: 'pending' | 'accepted' | 'denied' | 'cancelled';
  linkInitiator?: string;
  linkTarget?: string;
  // Nededed? If so change to Date or smtg
  timestamp?: number;
};
// @deprecate ni favor of players by role
export type MatchPlayers = {
  white: MatchPlayer;
  black: MatchPlayer;
};

export type MatchPlayersByRole = {
  challenger: MatchPlayer;
  challengee: MatchPlayer;
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
      winner: keyof MatchPlayersByRole | null;
      endedGames: EndedGame[];
      gameInPlay: NotEndedGame | null;
      rematch?: Boolean;
      messages: ChatMessage[];
      /**
       * This is the time allowed for one player to abort
       */
      timeToAbortMs: number;
      /**
       * This is the time bertween games
       */
      breakDurationMs: number;
    } & MatchPlayersByRole)
  | null; // TODO: This should not be null, but another status

export type MatchActions =
  | PlayActions
  | Action<'match:startNewGame'>
  | {
      type: 'play:updateChatState';
      payload: {
        userId: string;
        isChatEnabled: boolean;
        timestamp: number;
      };
    };

export type ChatMessage = {
  senderId: User['id'];
  content: string;
  timestamp: number;
  responseId?: string;
};
