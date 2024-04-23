import { objectKeys, toDictIndexedBy } from '@xmatter/util-kit';
import { PeerUserIdsMap, PeerUsersMap } from './type';

const namespace = 'ch';
export const wNamespace = (s: string) => `${namespace}${s}`;
export const woNamespace = (s: string) =>
  s.indexOf(namespace) > -1 ? s.slice(namespace.length) : s;

export const peerUsersMapToPeerIdsMap = (pm: PeerUsersMap): PeerUserIdsMap =>
  toDictIndexedBy(objectKeys(pm), (id) => id);
