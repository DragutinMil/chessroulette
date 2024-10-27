import { objectKeys, toDictIndexedBy } from '@xmatter/util-kit';
import { PeerUserIdsMap, PeerUsersMap } from '../PeerToPeerProvider';

export const peerUsersMapToPeerIdsMap = (pm: PeerUsersMap): PeerUserIdsMap =>
  toDictIndexedBy(objectKeys(pm), (id) => id);
