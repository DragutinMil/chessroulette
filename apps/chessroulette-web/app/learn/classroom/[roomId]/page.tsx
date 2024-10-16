import { Metadata } from 'next';
import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import { RoomTemplate } from 'apps/chessroulette-web/templates/RoomTemplate';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { metadata as rootMetadata } from '../../../page';
import { twilio } from 'apps/chessroulette-web/services/twilio';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/getCustomServerSession';

export const metadata: Metadata = {
  title: `Room | ${rootMetadata.title}`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: Partial<{ theme: string }>;
}) {
  const session = (await getCustomServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();

  const id = decodeURIComponent(params.roomId);
  const rid: ResourceIdentifier<'room'> = `room:${id}`;

  return (
    <RoomTemplate
      themeName={searchParams.theme}
      session={session}
      roomId={id}
      activity="learn"
    >
      <RoomContainer rid={rid} iceServers={iceServers} activity="learn" />
    </RoomTemplate>
  );
}
