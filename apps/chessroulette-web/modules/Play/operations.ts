import { CreatePendingGameParams, createPendingGame } from '../Game';
import { PendingPlayState, PlayersByColor } from './movex';

export const createPendingPlay = ({
  players,
  ...gameParams
}: CreatePendingGameParams & {
  players: PlayersByColor;
}): PendingPlayState => ({
  game: createPendingGame(gameParams),
  // players,
});
