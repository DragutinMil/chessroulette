const SIGNALING_SERVER_CONFIG = {
  // host: 'chessroulette-rtc-signaling.fly.dev',
  // port: 443,
  // secure: true,
  host: process.env.NEXT_PUBLIC_SIGNALING_SERVER_HOST as string,
  port: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_PORT),
  secure: Number(process.env.NEXT_PUBLIC_SIGNALING_SERVER_SECURE) === 1,
  // pingInterval: 30 * 1000,
};

const MOVEX_ENDPOINT_URL = process.env.NEXT_PUBLIC_MOVEX_ENDPOINT_URL as string;
const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL as string;

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// TODO: This could be changed from
const CAMERA_ON = process.env.NEXT_PUBLIC_CAMERA_ON === 'true' || !DEV_MODE;

export const config = {
  SIGNALING_SERVER_CONFIG,
  MOVEX_ENDPOINT_URL,
  ENGINE_URL,
  CAMERA_ON,
  DEV_MODE,
};

if (DEV_MODE) {
  console.log('Client Config', config);
}
