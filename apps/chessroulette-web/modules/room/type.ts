// export const p2pCommunicationType = io.keyof(
//   {
//     none: null,
//     audioOnly: null,
//     audioVideo: null,
//   },
//   'P2pCommunicationType'
// );

import { PeersMap } from '@app/providers/PeerToPeerProvider/type';

export type P2PCommunicationType = 'none' | 'audioOnly' | 'audioVideo';

// export type Room = {
//   id: string;

//   // TODO: Is thi sactually used?
//   p2pCommunicationType: P2PCommunicationType;

//   // This is for the connection
//   peers: PeersMap;
// };
