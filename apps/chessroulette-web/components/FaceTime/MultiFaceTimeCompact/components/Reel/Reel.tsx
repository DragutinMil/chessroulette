import React from 'react';
import { FaceTime } from '../../../FaceTime';
import {
  PeerUserId,
  StreamingPeer,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { MyFaceTime } from '../../../MyFaceTime';
import { AVStreamingConstraints } from 'apps/chessroulette-web/services/AVStreaming';

type Props = {
  streamingPeers: StreamingPeer[];
  onClick: (userId: PeerUserId) => void;

  containerClassName?: string;
  itemClassName?: string;

  myFaceTimeConstraints: AVStreamingConstraints;
};

export const Reel: React.FC<Props> = (props) => {
  return (
    <div className={props.containerClassName}>
      {props.streamingPeers.map((peer) => (
        <div
          key={peer.userId}
          className="overflow-hidden relative z-40 mb-2"
          onClick={() => props.onClick(peer.userId)}
        >
          <FaceTime
            streamConfig={peer.connection.channels.streaming}
            className="absolute inset-0 z-50 border border-white"
            aspectRatio={4 / 3}
            label={peer.userDisplayName}
            // label={"Test Label Reel"}
          />
        </div>
      ))}
      <div className={`overflow-hidden relative z-40 ${props.itemClassName}`}>
        <MyFaceTime
          constraints={props.myFaceTimeConstraints}
          className="relative z-30 border border-white"
          aspectRatio={4 / 3}
        />
      </div>
    </div>
  );
};
