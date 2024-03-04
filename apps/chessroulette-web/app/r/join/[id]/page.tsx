import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/components/JoinOrCreateRoom';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../page';
import { identifiableActivityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';

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
  const allParams = { ...searchParams, ...params };
  const result = identifiableActivityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
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
