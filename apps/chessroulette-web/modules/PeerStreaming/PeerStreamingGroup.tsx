import React, { useCallback, useEffect, useReducer } from 'react';
import { useWillUnmount } from 'apps/chessroulette-web/hooks/useWillUnmount';
import { P2PCommunicationType } from 'apps/chessroulette-web/modules/room/type';
import {
  PeerToPeerProvider,
  usePeerToPeerConnections,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider';
import {
  IceServerRecord,
  PeerUsersMap,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { initialPeerStreamingState, peerStreamingReducer } from './reducer';
import { UserId } from '../user/type';
import { Reel } from 'apps/chessroulette-web/components/FaceTime/MultiFaceTimeCompact';
import { useReel } from './hooks';
import { config } from 'apps/chessroulette-web/config';
import { peerUsersMapToPeerIdsMap } from 'apps/chessroulette-web/providers/PeerToPeerProvider/util';

type PeersConnectionProps = React.PropsWithChildren<{
  id: string;
  p2pCommunicationType: P2PCommunicationType;
  peerUsersMap: PeerUsersMap;
}>;

type Props = {
  groupId: string;
  clientUserId: UserId;
  peerUsersMap: PeerUsersMap; // This excludes the Local Client Peer (Me)
  p2pCommunicationType: P2PCommunicationType;
  iceServers: IceServerRecord[];
  render: (p: { reel: Reel | undefined }) => React.ReactNode;
};

// This should be a Memoized/Pure Component
export const PeerStreamingGroup: React.FC<Props> = (props) => {
  const [state, dispatch] = useReducer(
    peerStreamingReducer,
    initialPeerStreamingState
  );

  useEffect(() => {
    dispatch({
      type: 'updatePeers',
      payload: {
        peerUsersMap: props.peerUsersMap,
      },
    });
  }, [props.peerUsersMap, dispatch]);

  const reel = useReel({
    peersMap: state.peers,
    clientUserId: props.clientUserId,
  });

  if (!config.CAMERA_ON) {
    return <>{props.render({ reel })}</>;
  }

  return (
    // TODO: Ensure this doesn't get rendered multiple times (thus opening the peerjs connection multiple times)
    <PeerToPeerProvider
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
        peerUsersMap={props.peerUsersMap}
      >
        {props.render({ reel })}
      </PeersConnection>
    </PeerToPeerProvider>
  );
};

const PeersConnection: React.FC<PeersConnectionProps> = (props) => {
  const p2pConnections = usePeerToPeerConnections();

  // Once joined connect to all the peers in the room
  const connectToAllPeersInRoom = useCallback(() => {
    if (p2pConnections.ready && props.p2pCommunicationType === 'audioVideo') {
      p2pConnections.connectToPeers(
        peerUsersMapToPeerIdsMap(props.peerUsersMap)
      );
    }
    // TODO: Does this need to depend on the props.peerUsersMap and p2pCommunicationType
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
