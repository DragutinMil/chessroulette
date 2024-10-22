import { getRandomColor, invoke, isWhiteColor } from '@xmatter/util-kit';
import { MatchState } from '../types';
import { CreateMatchParamsSchema } from './operationsSchemas';
import { createPendingPlay } from '@app/modules/Match/Play/operations';

export const createMatchState = (
  params: CreateMatchParamsSchema
): MatchState => {
  const challengerColor = params.startColor || getRandomColor();

  const players = invoke((): NonNullable<MatchState>['players'] => {
    if (isWhiteColor(challengerColor)) {
      return {
        white: { id: params.challengerId, points: 0 },
        black: { id: params.challengeeId, points: 0 },
      };
    }

    return {
      white: { id: params.challengeeId, points: 0 },
      black: { id: params.challengerId, points: 0 },
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
    challengee: {
      id: params.challengeeId,
      points: 0,
    },
    challenger: {
      id: params.challengerId,
      points: 0,
    },
    winner: null,
    endedPlays: [],
    ongoingPlay: createPendingPlay({
      timeClass: params.timeClass || 'untimed',
      color: challengerColor,
      players: {
        w: players.white.id,
        b: players.black.id,
      },
    }),
  };
};
