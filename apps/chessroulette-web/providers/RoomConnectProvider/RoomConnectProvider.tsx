// import React, { useCallback, useEffect } from 'react';
// import { PeerToPeerProvider, usePeerToPeerConnections } from '../PeerToPeerProvider';
// import { useWillUnmount } from 'apps/chessroulette-web/hooks/useWillUnmount';
// import { Peer } from '../PeerToPeerProvider/type';
// // import { Room } from 'apps/chessroulette-web/modules/room/type';
// // import { useDispatch } from 'react-redux';
// // import { useWillUnmount } from 'src/lib/hooks/useWillUnmount';
// // import { Peer } from 'src/providers/PeerConnectionProvider';
// // import { PeerToPeerProvider, usePeerToPeerConnections } from 'src/providers/PeerToPeerProvider';
// // import { updateRoomPeerConnectionChannels } from '../../redux/actions';
// // import { JoinedRoom } from '../../types';

// type RoomConnectHandlerProps = React.PropsWithChildren<{
//   room: Room;
// }>;

// const RoomConnectHandler: React.FC<RoomConnectHandlerProps> = (props) => {
//   const p2pConnections = usePeerToPeerConnections();

//   // Once joined connect to all the peers in the room
//   const connectToAllPeersInRoom = useCallback(() => {
//     if (p2pConnections.ready && props.room.p2pCommunicationType === 'audioVideo') {
//       p2pConnections.connectToPeers(props.room.peers);
//     }
//   }, [p2pConnections.ready, props.room.id]);

//   const disconnectFromAllPeersInRoom = useCallback(() => {
//     if (p2pConnections.ready) {
//       p2pConnections.disconnectFromAllPeers();
//     }
//   }, [p2pConnections.ready]);

//   // Connect to the Room on Mount
//   useEffect(connectToAllPeersInRoom, [connectToAllPeersInRoom]);

//   // This is very important as the room needs to be updated with the
//   useWillUnmount(disconnectFromAllPeersInRoom, [disconnectFromAllPeersInRoom]);

//   return <>{props.children}</>;
// };

// type Props = React.PropsWithChildren<{
//   // room: JoinedRoom;
//   room: Room;
//   peer: Peer;
// }>;

// export const RoomConnectProvider: React.FC<Props> = (props) => {
//   // const dispatch = useDispatch();

//   return (
//     // TODO: Ensure this doesn't get rendered multiple times (ths opening the peerjs connection multiple times)
//     <PeerToPeerProvider
//       user={props.peer.user}
//       uniqId={props.room.id}
//       onPeerConnectionChannelsUpdated={(p) => {
//         console.log('onPeerConnectionChannelsUpdated', p);

//         // dispatch(updateRoomPeerConnectionChannels(p));
//       }}
//     >
//       <RoomConnectHandler room={props.room}>{props.children}</RoomConnectHandler>
//     </PeerToPeerProvider>
//   );
// };
