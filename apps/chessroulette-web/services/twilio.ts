import { Twilio } from 'twilio';
import { serverConfig } from '../config/config.server';
import { IceServerRecord } from '../modules/PeerToPeer/providers/PeerToPeerProvider/type';
import { config } from '../config';

// Helper function to check if Twilio credentials are valid
const hasValidTwilioCredentials = (): boolean => {
  const accountSid = serverConfig.twilio.TWILIO_ACCOUNT_SID;
  const authToken = serverConfig.twilio.TWILIO_AUTH_TOKEN;
  
  return !!(
    accountSid && 
    accountSid !== 'TBD' && 
    accountSid.trim() !== '' &&
    accountSid.startsWith('AC') &&
    authToken &&
    authToken !== 'TBD' &&
    authToken.trim() !== ''
  );
};

// Lazy initialization - only create client when needed and if credentials are valid
let twilioClient: Twilio | null = null;

const getTwilioClient = (): Twilio | null => {
  if (!hasValidTwilioCredentials()) {
    return null;
  }
  
  if (!twilioClient) {
    twilioClient = new Twilio(
      serverConfig.twilio.TWILIO_ACCOUNT_SID,
      serverConfig.twilio.TWILIO_AUTH_TOKEN
    );
  }
  
  return twilioClient;
};

const DEFAULT_ICE_SERVERS = [
  {
    url: 'stun:stun.ideasip.com',
    urls: 'stun:stun.ideasip.com',
    credential: undefined,
    username: undefined,
  },
];

export const twilio = {
  DEFAULT_ICE_SERVERS,
  getIceServers: async (): Promise<IceServerRecord[]> => {
    try {
      if (!config.CAMERA_ON) {
        throw 'Camera off - meant to catch!';
      }

      const client = getTwilioClient();
      if (!client) {
        // Return defaults if Twilio is not configured
        return DEFAULT_ICE_SERVERS;
      }

      const twilioIceServers = (await client.tokens.create()).iceServers;
      
      // Map Twilio's response to match IceServerRecord type
      // Filter out servers without url and ensure url/urls are strings
      return twilioIceServers
        .filter((server): server is typeof server & { url: string; urls: string } => {
          return !!server.url && !!server.urls;
        })
        .map((server) => ({
          url: server.url!,
          urls: server.urls!,
          credential: server.credential,
          username: server.username,
        }));
    } catch {
      // Return the defaults if no connection or other error
      return DEFAULT_ICE_SERVERS;
    }
  },
};