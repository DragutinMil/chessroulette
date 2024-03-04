import { getServerSession } from 'next-auth';
import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from 'apps/chessroulette-web/services/auth';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { Metadata } from 'next';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';
import { metadata as rootMetadata } from '../../../../page';
import { twilio } from 'apps/chessroulette-web/services/twiliio';

export const metadata: Metadata = {
  title: `Room | ${rootMetadata.title}`,
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Partial<{ theme: string }>;
}) {
  const session = (await getServerSession(authOptions)) || undefined;
  const iceServers = await twilio.getIceServers();

  const id = decodeURIComponent(params.id);
  const rid: ResourceIdentifier<'room'> = `room:${id}`;

  console.log('learn rid', rid)
  console.log('learn params', params)

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
