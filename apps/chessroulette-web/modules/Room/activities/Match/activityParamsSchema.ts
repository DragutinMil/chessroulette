// import { chessColorSchema, createMatchParamsSchema } from '@app/modules/Match';
import { createMatchParamsSchema } from '@app/modules/Match/movex';
import z from 'zod';

export const matchActivityParamsSchema = createMatchParamsSchema;

export type MatchActivityParamsSchema = z.TypeOf<
  typeof matchActivityParamsSchema
>;
