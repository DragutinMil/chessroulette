import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/components/JoinOrCreateRoom';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../page';
import { identifiableActivityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';

export const metadata: Metadata = {
  title: `Join Room | ${rootMetadata.title}`,
};

export default function Page({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const result = identifiableActivityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams({ ...searchParams, ...params }))
  );

  if (!result.success) {
    throw result.error;
  }

  const { activity, id, ...nextParamsObj } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(nextParamsObj).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return <JoinOrCreateRoom mode="join" id={id} activity={activity} />;
}
