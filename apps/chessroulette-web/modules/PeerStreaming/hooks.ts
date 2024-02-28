import {
  Peer,
  PeersMap,
  StreamingPeer,
  StreamingPeersMap,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useEffect, useMemo, useReducer } from 'react';
import { initialPeerStreamingState, peerStreamingReducer } from './reducer';
import { Reel } from 'apps/chessroulette-web/components/FaceTime/MultiFaceTimeCompact';

type Props = {
  peersMap: PeersMap;
  clientUserId: Peer['userId'];
  focusedUserId?: Peer['userId'];
};

// export const useStreamingPeers = ({ peersMap, focusedUserId }: Props) => {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const streamersMap = useMemo(() => {
//     return Object.values(peersMap).reduce((prev, next) => {
//       if (!isStreamingPeer(next)) {
//         return prev;
//       }

//       return {
//         ...prev,
//         [next.id]: next,
//       };
//     }, {} as StreamingPeersMap);
//   }, [peersMap]);
// };

export const isStreamingPeer = (p: Peer): p is StreamingPeer =>
  p.connection.channels.streaming.on === true;

// export

export const useReel = ({
  peersMap,
  clientUserId,
  focusedUserId,
}: Props): Reel | undefined => {
  // const [state, dispatch] = useReducer(peerStreamingReducer, initialPeerStreamingState);

  // console.log('use reel peersMap:', peersMap);ƒ

  const peersMapValues = Object.values(peersMap);

  const streamersMap = useMemo(() => {
    return peersMapValues.reduce((prev, next) => {
      if (!isStreamingPeer(next)) {
        return prev;
      }

      return {
        ...prev,
        [next.userId]: next,
      };
    }, {} as StreamingPeersMap);
  }, [peersMap]);

  // const streamerMapValues = Object.values(streamersMap);

  const focusedStreamingPeer =
    (focusedUserId && streamersMap[focusedUserId]) ||
    Object.values(streamersMap)[0];

  const { [focusedStreamingPeer?.userId]: removed, ...streamersMapSinFocused } =
    streamersMap;

  // useEffect(() => {
  //   dispatch(
  //     initAction({
  //       streamersMap,
  //       focusedUserId,
  //     })
  //   );
  // }, [streamersMap, focusedUserId]);

  // useEffect(() => {
  //   dispatch(updateAction({ streamersMap }));
  // }, [streamersMap]);

  // useEffect(() => {
  //   if (focusedUserId) {
  //     dispatch(focusAction({ userId: focusedUserId }));
  //   }
  // }, [focusedUserId]);

  // const onFocus = useCallback(
  //   (userId: UserRecord['id']) => {
  //     if (state.ready) {
  //       dispatch(focusAction({ userId }));
  //     }
  //   },
  //   [state.ready]
  // );

  const streamersSinFocusedList = Object.values(streamersMapSinFocused);

  if (!focusedStreamingPeer) {
    return undefined;
  }

  // if (streamerMapValues.length === 0) {
  //   return undefined;
  // }

  // if (streamerMapValues.length === 1) {
  //   return {
  //     streamingPeers: [],
  //     focusedStreamingPeer: streamerMapValues[0], // TODO Fix
  //     // TODO: Add these back
  //     // myStreamingPeerId: StreamingPeer['userId'];
  //     // focusedStreamingPeer: Pick<StreamingPeer, 'connection'>; // TODO: Bring back
  //   };
  // }

  return {
    streamingPeers: streamersSinFocusedList,
    focusedStreamingPeer: focusedStreamingPeer,
    myStreamingPeerUserId: clientUserId,
    // TODO: Add these back
    // myStreamingPeerId: StreamingPeer['userId'];
    // focusedStreamingPeer: Pick<StreamingPeer, 'connection'>; // TODO: Bring back
  };
};
