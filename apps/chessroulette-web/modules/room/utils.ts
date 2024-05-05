import { keyInObject } from '@xmatter/util-kit';
import { PlayActivitySettings } from './activities/Play/usePlayActivitySettings';

export const roomSettingsIsPlay = (
  roomSettings: object
): roomSettings is PlayActivitySettings => {
  return keyInObject(roomSettings, 'gameType');
};
