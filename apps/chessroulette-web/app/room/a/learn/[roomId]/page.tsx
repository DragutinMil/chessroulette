import { Metadata } from 'next';
import { ResourceIdentifier } from 'movex-core-util';
import { StringRecord } from '@xmatter/util-kit';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import { RoomTemplate } from 'apps/chessroulette-web/templates/RoomTemplate';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { metadata as rootMetadata } from '../../../../page';
import { twilio } from 'apps/chessroulette-web/services/twiliio';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/getCustomServerSession';
import { roomIdParamsSchema } from 'apps/chessroulette-web/modules/room/io/paramsSchema';
import { ErrorPage } from 'apps/chessroulette-web/appPages/ErrorPage';

export const metadata: Metadata = {
  title: `Room | ${rootMetadata.title}`,
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
  const roomId = decodeURIComponent(result.data.roomId);
  const rid: ResourceIdentifier<'room'> = `room:${roomId}`;

  return (
    <RoomTemplate
      themeName={searchParams.theme}
      session={session}
      roomId={roomId}
      activity="learn"
    >
      {/* // TODO: Here can show suspense with loading of a none room or smtg for server rendering! */}
      <RoomContainer rid={rid} iceServers={iceServers} activity="learn" />
    </RoomTemplate>
  );
}
