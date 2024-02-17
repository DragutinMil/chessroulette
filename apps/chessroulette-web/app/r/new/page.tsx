import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/JoinOrCreateRoom';
import { getRandomStr } from 'apps/chessroulette-web/util';
import { Metadata } from 'next';
import z from 'zod';

export const metadata: Metadata = {
  title: 'Chessroulette',
};

const paramsSchema = z.object({
  // client: z.string(), // Outpost // TODO: this can be used later when they hit the api, now just the op prefixed id
  activity: z.literal('learn'), // This will be more in the future like play or others
  instructor: z
    .union([z.literal('1').or(z.literal(1)), z.literal('0').or(z.literal(0))])
    .optional(), // optional whether the user is an instructor
  theme: z.string().optional(),
});

export default function Page({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const result = paramsSchema.safeParse(
    Object.fromEntries(new URLSearchParams({ ...searchParams, ...params }))
  );

  if (!result.success) {
    return <>{JSON.stringify(result.error)}</>;
  }

  const { activity, ...nextParamsObj } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(nextParamsObj).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return <JoinOrCreateRoom id={getRandomStr(7)} activity={activity} />;
}

// http://localhost:4200/r/new?activity=learn&id=[:id]
