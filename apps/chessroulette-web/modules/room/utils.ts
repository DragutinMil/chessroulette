import { keyInObject } from '@xmatter/util-kit';
import { PlayActivitySettings } from './activities/Play/usePlayActivitySettings';

export const roomSettingsIsPlay = (
  roomSettings: object
): roomSettings is PlayActivitySettings => {
  // TODO: This is probably not the best way to determine if it's play
  return keyInObject(roomSettings, 'gameTimeClass');
};
