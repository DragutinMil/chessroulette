import {
  Peer,
  PeerRecord,
  PeerUserIdsMap,
  PeersMap,
  StreamingPeer,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { Action } from 'movex-core-util';
import { ReducerAction } from 'react';

// type Actions = ReducerAction<'asd'>

export type PeerStreamingState = {
  peers: PeersMap;
};

export type PeerStreamingActions =
  | Action<
      'updatePeerConnection',
      {
        peerUserId: Peer['userId'];
        channels: Partial<Peer['connection']['channels']>;
      }
    >
  | Action<'updatePeers', { peerUserIdsMap: PeerUserIdsMap }>;

export const initialPeerStreamingState: PeerStreamingState = {
  peers: {},
};

const peerRecordToPeer = (peer: PeerRecord): Peer => {
  return {
    ...peer,
    // isMe,
    connection: {
      // This shouldn't be so
      // there's no connetion with myself :)
      channels: {
        data: { on: true },
        streaming: { on: false },
      },
    },
  };
};

export const peerStreamingReducer = (
  state = initialPeerStreamingState,
  action: PeerStreamingActions
) => {
  if (action.type === 'updatePeers') {
    return {
      peers: Object.values(action.payload.peerUserIdsMap)
        .map((peerUserId) => {
          // If already present use it
          if (state.peers[peerUserId]) {
            return state.peers[peerUserId];
          }

          // Otherwise add the new one
          return peerRecordToPeer({ userId: peerUserId });
        })
        .reduce(
          (prev, next) => ({
            ...prev,
            [next.userId]: next,
          }),
          {} as PeersMap
        ),
    };
  }

  if (action.type === 'updatePeerConnection') {
    if (!state.peers[action.payload.peerUserId]) {
      return state;
    }

    const nextPeer: Peer = {
      ...state.peers[action.payload.peerUserId],
      connection: {
        ...state.peers[action.payload.peerUserId].connection,
        channels: {
          ...state.peers[action.payload.peerUserId].connection.channels,
          ...action.payload.channels,
        },
      },
    };

    return {
      peers: {
        ...state.peers,
        [nextPeer.userId]: nextPeer,
      },
    };
  }

  return state;
};
