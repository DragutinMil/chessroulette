import React, { useCallback, useEffect, useReducer } from 'react';
// import {
//   PeerToPeerProvider,
//   usePeerToPeerConnections,
// } from '../PeerToPeerProvider';
import { useWillUnmount } from 'apps/chessroulette-web/hooks/useWillUnmount';
// import { Peer } from '../PeerToPeerProvider/type';
import { P2PCommunicationType } from 'apps/chessroulette-web/modules/room/type';
import {
  PeerToPeerProvider,
  usePeerToPeerConnections,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider';
import {
  IceServerRecord,
  PeerUserId,
  PeerUserIdsMap,
  // PeerUser,
  PeersMap,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { initialPeerStreamingState, peerStreamingReducer } from './reducer';
import { User, UserId } from '../user/type';
import { Reel } from 'apps/chessroulette-web/components/FaceTime/MultiFaceTimeCompact';
import { useReel } from './hooks';
import { config } from 'apps/chessroulette-web/config';
// import { useDispatch } from 'react-redux';
// import { useWillUnmount } from 'src/lib/hooks/useWillUnmount';
// import { Peer } from 'src/providers/PeerConnectionProvider';
// import { PeerToPeerProvider, usePeerToPeerConnections } from 'src/providers/PeerToPeerProvider';
// import { updateRoomPeerConnectionChannels } from '../../redux/actions';
// import { JoinedRoom } from '../../types';

type PeersConnectionProps = React.PropsWithChildren<{
  id: string;
  p2pCommunicationType: P2PCommunicationType;
  peerUserIdsMap: PeerUserIdsMap;
  // room: Room;
}>;

const PeersConnection: React.FC<PeersConnectionProps> = (props) => {
  const p2pConnections = usePeerToPeerConnections();

  // Once joined connect to all the peers in the room
  const connectToAllPeersInRoom = useCallback(() => {
    if (p2pConnections.ready && props.p2pCommunicationType === 'audioVideo') {
      p2pConnections.connectToPeers(props.peerUserIdsMap);
    }
  }, [p2pConnections.ready, props.id]);

  const disconnectFromAllPeersInRoom = useCallback(() => {
    if (p2pConnections.ready) {
      p2pConnections.disconnectFromAllPeers();
    }
  }, [p2pConnections.ready]);

  // Connect to the Room on Mount
  useEffect(connectToAllPeersInRoom, [connectToAllPeersInRoom]);

  // This is very important as the room needs to be updated with the
  useWillUnmount(disconnectFromAllPeersInRoom, [disconnectFromAllPeersInRoom]);

  return <>{props.children}</>;
};

type Props = {
  groupId: string;
  clientUserId: UserId;
  peerUserIdsMap: PeerUserIdsMap; // This excludes the Local Client Peer (Me)
  p2pCommunicationType: P2PCommunicationType;
  iceServers: IceServerRecord[];
  render: (p: { reel: Reel | undefined }) => React.ReactNode;
};

// const peersMapToReel = (peers: PeersMap): Reel => {

// }

// This is a Memoized/Pure Component
export const PeerStreamingGroup: React.FC<Props> = (props) => {
  // const dispatch = useDispatch();
  const [state, dispatch] = useReducer(
    peerStreamingReducer,
    initialPeerStreamingState
  );

  useEffect(() => {
    dispatch({
      type: 'updatePeers',
      payload: {
        peerUserIdsMap: props.peerUserIdsMap,
      },
    });
  }, [props.peerUserIdsMap, dispatch]);

  // console.log('PeerStreamingGroup state', state);

  // const reel = useMemo<Reel>(() => ({

  // }), state.peers)

  // const reel = useMemo<Reel>(() => {
  //   return {
  //     streamingPeers: state.peers,
  //     // myStreamingPeerId: room.me.userId,
  //     focusedStreamingPeer: state.inFocus,
  //   }
  // }, [state.peers]);

  const reel = useReel({
    peersMap: state.peers,
    clientUserId: props.clientUserId,
  });

  if (!config.CAMERA_ON) {
    return <>{props.render({ reel })}</>;
  }

  return (
    // TODO: Ensure this doesn't get rendered multiple times (ths opening the peerjs connection multiple times)
    <PeerToPeerProvider
      // user={props.peerUser}
      clientUserId={props.clientUserId}
      iceServers={props.iceServers}
      uniqId={props.groupId}
      onPeerConnectionChannelsUpdated={(payload) => {
        dispatch({ type: 'updatePeerConnection', payload });
      }}
    >
      <PeersConnection
        id={props.groupId}
        p2pCommunicationType={props.p2pCommunicationType}
        peerUserIdsMap={props.peerUserIdsMap}
      >
        {props.render({ reel })}
      </PeersConnection>
    </PeerToPeerProvider>
  );
};
