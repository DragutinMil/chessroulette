import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/JoinOrCreateRoom';
import { Metadata } from 'next';
import z from 'zod';

export const metadata: Metadata = {
  title: 'Chessroulette',
};

const paramsSchema = z.object({
  id: z.string(), // room id
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

  const { activity, id, ...nextParamsObj } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(nextParamsObj).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  // TODO: Here the room can be created on demand via the API

  // const formattedId = `${client}${id}`;
  // return (
  //   <div>
  //     works {activity} {id}
  //   </div>
  // )

  return (
    <JoinOrCreateRoom
      mode="join"
      id={id}
      activity={activity}
      // forwardSearchParamsString={nextParams.toString()}
    />
  );
}

// http://localhost:4200/r/new?activity=learn&id=[:id]
