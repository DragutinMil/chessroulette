import { StreamingPeer } from './providers/PeerToPeerProvider';

export type ReelState = {
  streamingPeers: StreamingPeer[];
  // TODO: Add these back
  myStreamingPeerUserId: StreamingPeer['userId'];
  focusedStreamingPeer: Pick<
    StreamingPeer,
    'connection' | 'userId' | 'userDisplayName'
  >; // TODO: Bring back
};
