import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/components/JoinOrCreateRoom';
import { roomIdentifiableActivityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../../page';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';
import { objectOmit, objectPick } from '@xmatter/util-kit';

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

  // const nextParams = new URLSearchParams();

  // const sanitizedActivityParams = objectPick(activityParams, [
  //   'activity',
  //   'theme',
  // ]);

  // Object.entries(activityParams).forEach(([k, v]) => {
  //   if (v) {
  //     nextParams.set(k, String(v));
  //   }
  // });

  // return (
  //   <pre>
  //     {JSON.stringify(activityParams, null, 2)}
  //     {JSON.stringify(activityParams, null, 2)}
  //   </pre>
  // );

  return (
    <JoinOrCreateRoom
      mode="joinOrCreate"
      roomId={roomId}
      activityParams={activityParams}
      // forwardSearchParamsString={nextParams.toString()}
    />
  );
}
