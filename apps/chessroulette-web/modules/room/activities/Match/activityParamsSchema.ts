// import { chessColorSchema, createMatchParamsSchema } from '@app/modules/Match';
import { chessColorSchema } from '@app/modules/Match/movex';
import { gameTimeClassRecord } from '@app/modules/Game/io';
import z from 'zod';

// Note: This is an exact copy of modules/Match/ createMatchParamsSchema
//  the reason for it being a copy is that I cannot compose that with zode intersection
//  and still be able to discriminateUnion on it. Stupid but these are the limitations
//  atm. 
// See https://github.com/colinhacks/zod/issues/2106 & https://github.com/colinhacks/zod/issues/2567 for more details
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
