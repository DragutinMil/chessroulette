import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/components/JoinOrCreateRoom';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../page';
import { roomIdentifiableActivityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';
import { StringRecord } from '@xmatter/util-kit';

export const metadata: Metadata = {
  title: `Join Room | ${rootMetadata.title}`,
};

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: StringRecord;
  params: StringRecord;
}) {
  const allParams = Object.assign(searchParams, params);
  const result = roomIdentifiableActivityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
  }

  const { roomId, ...activityParams } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(activityParams).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return (
    <JoinOrCreateRoom
      mode="join"
      roomId={roomId}
      activityParams={activityParams}
    />
  );
}
