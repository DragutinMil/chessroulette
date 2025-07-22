import { Metadata } from 'next';
import { ResourceIdentifier } from 'movex-core-util';
import { authOptions } from '@app/services/Auth';
import { RoomTemplate } from '@app/modules/Room/RoomTemplate';
import { RoomContainer } from '@app/modules/Room/RoomContainer';
import { metadata as rootMetadata } from '../../../page';
import { twilio } from '@app/services/twilio';
import { getCustomServerSession } from '@app/services/Auth/getCustomServerSession';

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
  //pagerica braleee
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
