import { Twilio } from 'twilio';
import { getServerSession } from 'next-auth';
import { ResourceIdentifier } from 'movex-core-util';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { config } from 'apps/chessroulette-web/config';
import { authOptions } from 'apps/chessroulette-web/services/auth';
import RoomTemplate from 'apps/chessroulette-web/templates/RoomTemplate';
import { serverConfig } from 'apps/chessroulette-web/config/config.server';
import { Metadata } from 'next';
import { RoomContainer } from 'apps/chessroulette-web/modules/room/RoomContainer';

export const metadata: Metadata = {
  title: 'Learn | Chessroulette',
  description: 'Moves That Matter Lessons That Last',
};

const twilioClient: any = new Twilio(
  serverConfig.twilio.TWILIO_ACCOUNT_SID,
  serverConfig.twilio.TWILIO_AUTH_TOKEN
);

const twilio = {
  getIceServers: async (): Promise<IceServerRecord[]> => {
    try {
      if (!config.CAMERA_ON) {
        throw 'camera off - meant to catch!';
      }

      return (await twilioClient.tokens.create()).iceServers;
    } catch {
      // Return the defaults if no connection or other error
      return [
        {
          url: 'stun:stun.ideasip.com',
          urls: 'stun:stun.ideasip.com',
          credential: undefined,
          username: undefined,
        },
      ];
    }
  },
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { rid: string };
  searchParams: Partial<{ theme: string }>;
}) {
  const session = (await getServerSession(authOptions)) || undefined;
  const id = decodeURIComponent(params.rid);
  const rid: ResourceIdentifier<'room'> = `room:${id}`;

  // // TODO: make it better
  const iceServers = (await twilio.getIceServers()) || [
    // DEFAULT
    {
      url: 'stun:stun.ideasip.com',
      urls: 'stun:stun.ideasip.com',
      credential: undefined,
      username: undefined,
    },
  ];

  return (
    <RoomTemplate themeName={searchParams.theme} session={session} roomId={id}>
      <RoomContainer rid={rid} iceServers={iceServers} activity="meetup" />
    </RoomTemplate>
  );
}
