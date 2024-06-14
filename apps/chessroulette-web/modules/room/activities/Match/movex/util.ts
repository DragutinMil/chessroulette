import {
  DistributiveOmit,
  getRandomColor,
  invoke,
  isWhiteColor,
} from '@xmatter/util-kit';
import { MatchState } from './types';
import { setupNewGame } from 'apps/chessroulette-web/modules/Play/store';
import { MatchActivityParamsSchema } from '../activityParamsSchema';

export const setupNewMatchState = (
  params: DistributiveOmit<MatchActivityParamsSchema, 'activity'>
): MatchState => {
  const challengerColor = params.startColor || getRandomColor();
  const players = invoke((): MatchState['players'] => {
    if (isWhiteColor(challengerColor)) {
      return {
        white: { id: params.challengerId },
        black: { id: params.challengeeId },
      };
    }

    return {
      white: { id: params.challengeeId },
      black: { id: params.challengerId },
    };
  });

  return {
    status: 'pending',
    ...(params.type === 'bestOf'
      ? {
          type: params.type,
          rounds: params.rounds || 1, // Default to one round if not specified
        }
      : {
          type: params.type,
        }),
    players,
    ...(params.timeClass && {
      timeClass: params.timeClass,
    }),
    completedPlays: [],
    ongoingPlay: {
      game: setupNewGame(params.timeClass || 'untimed', challengerColor),
    },
  };
};
