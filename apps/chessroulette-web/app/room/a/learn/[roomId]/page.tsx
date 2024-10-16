import { Metadata } from 'next';
import { ResourceIdentifier } from 'movex-core-util';
import { StringRecord } from '@xmatter/util-kit';
import { authOptions } from '@app/services/Auth';
import { RoomTemplate } from '@app/templates/RoomTemplate';
import { RoomContainer } from '@app/modules/room/RoomContainer';
import { metadata as rootMetadata } from '../../../../page';
import { twilio } from '@app/services/twilio';
import { getCustomServerSession } from '@app/services/Auth/getCustomServerSession';
import { roomIdParamsSchema } from '@app/modules/room/io/paramsSchema';
import { ErrorPage } from '@app/appPages/ErrorPage';

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
