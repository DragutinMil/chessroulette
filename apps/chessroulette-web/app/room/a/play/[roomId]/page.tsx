import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { Metadata } from 'next';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { twilio } from 'apps/chessroulette-web/services/twiliio';
import { metadata as rootMetadata } from '../../../../page';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';
import { StringRecord } from '@xmatter/util-kit';
import { roomIdParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';

export const metadata: Metadata = {
  title: `Play | ${rootMetadata.title}`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: StringRecord;
  searchParams: Partial<{ theme: string }>;
}) {
  const result = roomIdParamsSchema.safeParse(
    Object.fromEntries(new URLSearchParams(params))
  );

  if (!result.success) {
    return <ErrorPage error={result.error} extra={params} />;
  }

  const session = (await getCustomServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();
  const id = decodeURIComponent(result.data.roomId);
  const rid: ResourceIdentifier<'room'> = `room:${id}`;

  return (
    <RoomTemplate
      themeName={searchParams.theme}
      session={session}
      roomId={id}
      activity="play"
    >
      <RoomContainer rid={rid} iceServers={iceServers} activity="play" />
    </RoomTemplate>
  );
}
