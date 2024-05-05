import z from 'zod';

const truthyParam = z
  .union([
    z.literal('1').or(z.literal(1)),
    z.literal('0').or(z.literal(0)),
    z.literal('true').or(z.literal('false')),
  ])
  .default(0); // Set a default instead of failing the whole page

const idParamsSchema = z.object({ id: z.string() }); // room id,;

const themeParamsSchema = z.object({
  theme: z.string(),
});

const generalActivityParamsSchema = themeParamsSchema.partial(); // can add more here

export const learnActivityParamsSchema = z.object({
  activity: z.literal('learn'), // This will be more in the future like play or others

  // Learn Actibity Settings
  instructor: truthyParam.optional(),
});

export type LearnActivityParamsSchema = z.TypeOf<
  typeof learnActivityParamsSchema
>;

export const meetupActivityParamsSchema = z.object({
  activity: z.literal('meetup'), // This will be more in the future like play or others
  // Add the specific settings here
});

export const playActivityParamsSchema = z.object({
  activity: z.literal('play'),
});

export const activityParamsSchema = z
  .discriminatedUnion('activity', [
    learnActivityParamsSchema,
    meetupActivityParamsSchema,
    playActivityParamsSchema,
  ])
  .and(generalActivityParamsSchema);

export const identifiableActivityParamsSchema =
  activityParamsSchema.and(idParamsSchema);
