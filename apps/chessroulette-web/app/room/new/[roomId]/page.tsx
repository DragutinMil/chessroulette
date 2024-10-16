import { JoinOrCreateRoom } from '@app/modules/room/components/JoinOrCreateRoom';
import { roomIdentifiableActivityParamsSchema } from '@app/modules/room/io/paramsSchema';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../page';
import { ErrorPage } from '@app/appPages/ErrorPage';

export const metadata: Metadata = {
  title: `Join Or Create Room | ${rootMetadata.title}`,
};

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {
  const allParams = Object.assign(searchParams, params);
  const result = roomIdentifiableActivityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
  }

  const { roomId, ...activityParams } = result.data;

  return (
    <JoinOrCreateRoom
      mode="joinOrCreate"
      roomId={roomId}
      activityParams={activityParams}
    />
  );
}
