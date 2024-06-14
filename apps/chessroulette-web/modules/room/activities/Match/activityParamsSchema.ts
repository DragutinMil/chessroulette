import { gameTimeClassRecord } from 'apps/chessroulette-web/modules/Play/types';
import z from 'zod';

export const whiteChessColorSchema = z.literal('white').or(z.literal('w'));
export const blackChessColorSchema = z.literal('black').or(z.literal('b'));
export const chessColorSchema = z.union([
  whiteChessColorSchema,
  blackChessColorSchema,
]);

export const matchActivityParamsSchema = z.object({
  activity: z.literal('match'),

  // TODO: Type these better
  type: z.union([
    z.literal('bestOf'), // BestOf = best out of N Rounds (e.g. 2 out of 3, 3 out of 5, etc...)
    z.literal('openEnded'), // This has no predefined rounds
  ]),
  // Rounds is only needed when "type" = "bestOf" and is an Odd Positive Number
  rounds: z.coerce.number().optional(),

  timeClass: gameTimeClassRecord.optional(),

  // Players
  challengerId: z.string(),
  challengeeId: z.string(),

  // This is the color of the challenger
  // If no color specified it's assigned randomly 
  startColor: chessColorSchema.optional(),
});

export type MatchActivityParamsSchema = z.TypeOf<
  typeof matchActivityParamsSchema
>;
