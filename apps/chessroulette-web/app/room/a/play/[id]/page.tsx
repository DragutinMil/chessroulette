import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from 'apps/chessroulette-web/services/Auth';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { Metadata } from 'next';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { twilio } from 'apps/chessroulette-web/services/twiliio';
import { metadata as rootMetadata } from '../../../../page';
import { getCustomServerSession } from 'apps/chessroulette-web/services/Auth/lib';

export const metadata: Metadata = {
  title: `Play | ${rootMetadata.title}`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Partial<{ theme: string }>;
}) {
  const session = (await getCustomServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();

  const id = decodeURIComponent(params.id);
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
