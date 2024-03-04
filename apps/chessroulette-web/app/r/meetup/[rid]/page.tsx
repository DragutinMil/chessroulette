import { getServerSession } from 'next-auth';
import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from 'apps/chessroulette-web/services/auth';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { Metadata } from 'next';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { twilio } from 'apps/chessroulette-web/services/twiliio';
import { metadata as rootMetadata } from '../../../page';

export const metadata: Metadata = {
  title: `Meetup | ${rootMetadata.title}`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { rid: string };
  searchParams: Partial<{ theme: string }>;
}) {
  const session = (await getServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();

  const id = decodeURIComponent(params.rid);
  const rid: ResourceIdentifier<'room'> = `room:${id}`;

  return (
    <RoomTemplate
      themeName={searchParams.theme}
      session={session}
      roomId={id}
      activity="meetup"
    >
      <RoomContainer rid={rid} iceServers={iceServers} activity="meetup" />
    </RoomTemplate>
  );
}
