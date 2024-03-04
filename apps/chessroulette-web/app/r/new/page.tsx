import { JoinOrCreateRoom } from 'apps/chessroulette-web/modules/room/components/JoinOrCreateRoom';
import { Metadata } from 'next';
import { metadata as rootMetadata } from '../../page';
import { activityParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';

export const metadata: Metadata = {
  title: `New Room | ${rootMetadata.title}`,
};

export default function Page({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>;
  params: Record<string, string>;
}) {

  const allParams = { ...searchParams, ...params };
  const result = activityParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(allParams))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={allParams} />;
  }


  if (1 === 1) {
    return (
      <div>
      <div>of course it works</div>
      {allParams && <pre>Exra: {JSON.stringify(allParams, null, 2)}</pre>}
      </div>
      
    )
  }


  const { activity, ...nextParamsObj } = result.data;

  const nextParams = new URLSearchParams();

  Object.entries(nextParamsObj).forEach(([k, v]) => {
    if (v) {
      nextParams.set(k, String(v));
    }
  });

  return <JoinOrCreateRoom mode="create" activity={activity} />;
}
