import z from 'zod';

const truthyParam = z
  .union([
    z.literal('1').or(z.literal(1)),
    z.literal('0').or(z.literal(0)),
    z.literal('true').or(z.literal('false')),
  ])
  .default(0); // Set a default instead of failing the whole page

const idParamsSchema = z.object({ id: z.string() }); // room id,;

const themeParamsSchema = z
  .object({
    theme: z.string(),
  })
  .partial();

const learnActivitySettingParamsSchema = z
  .object({
    instructor: truthyParam,
  })
  .partial();

export const learnActivityParamsSchema = z
  .object({
    activity: z.literal('learn'), // This will be more in the future like play or others
  })
  .and(learnActivitySettingParamsSchema)
  .and(themeParamsSchema);

type LearnActivityParamsSchema = z.TypeOf<typeof learnActivityParamsSchema>;

export const identifiableLearnActivityParamsScheme = idParamsSchema.and(
  learnActivityParamsSchema
);

type IdentifiableLearnActivityParamsScheme = z.TypeOf<
  typeof identifiableLearnActivityParamsScheme
>;

export const meetupActivityParamsSchema = z
  .object({
    activity: z.literal('meetup'), // This will be more in the future like play or others
  })
  // .and(learnActivitySettingParamsSchema)
  .and(themeParamsSchema);

export const identifiableMeetupActivityParamsSchema = idParamsSchema.and(
  meetupActivityParamsSchema
);

export const activityParamsSchema = z.union([
  learnActivityParamsSchema,
  meetupActivityParamsSchema,
]);

export const identifiableActivityParamsSchema =
  activityParamsSchema.and(idParamsSchema);
