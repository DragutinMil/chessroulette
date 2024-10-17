import { getRandomColor, invoke, isWhiteColor } from '@xmatter/util-kit';
import { createPendingGame } from '@app/modules/Play/movex';
import { MatchState } from '../types';
import { CreateMatchParamsSchema } from './operationsSchemas';

export const createMatchState = (params: CreateMatchParamsSchema): MatchState => {
  const challengerColor = params.startColor || getRandomColor();
  const players = invoke((): NonNullable<MatchState>['players'] => {
    if (isWhiteColor(challengerColor)) {
      return {
        white: { id: params.challengerId, score: 0 },
        black: { id: params.challengeeId, score: 0 },
      };
    }

    return {
      white: { id: params.challengeeId, score: 0 },
      black: { id: params.challengerId, score: 0 },
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
    winner: null,
    endedPlays: [],
    ongoingPlay: {
      game: createPendingGame({
        timeClass: params.timeClass || 'untimed',
        color: challengerColor,
      }),
    },
  };
};
