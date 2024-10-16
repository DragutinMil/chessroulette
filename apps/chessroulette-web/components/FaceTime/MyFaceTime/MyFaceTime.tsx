'use client';

import React, { useEffect, useState } from 'react';
import { FaceTime, FaceTimeProps } from '../FaceTime/FaceTime';
import {
  AVStreaming,
  AVStreamingConstraints,
  DEFAULT_AV_STREAMING_CONSTRAINTS,
  getAVStreamingInstance,
} from '@app/services/AVStreaming';
import { PeerStreamingConfig } from '@app/providers/PeerToPeerProvider/type';
import useInstance from '@use-it/instance';

type Props = Omit<FaceTimeProps, 'streamConfig'> & {
  constraints?: AVStreamingConstraints;
};

// Automatically opens a local stream
export const MyFaceTime: React.FC<Props> = ({
  mirrorImage = true, // by default it's mirrored
  constraints,
  ...props
}) => {
  const avStreamingInstance = useInstance<AVStreaming>(getAVStreamingInstance);
  const [myStreamConfig, setMyStreamConfig] = useState<PeerStreamingConfig>({
    on: false,
  });

  useEffect(() => {
    if (myStreamConfig.on) {
      return;
    }

    const streamPromise = avStreamingInstance.getStream().then((stream) => {
      setMyStreamConfig({
        on: true,
        type: 'audio-video',
        stream,
      });

      return stream;
    });

    return () => {
      streamPromise.then((stream) => {
        avStreamingInstance.destroyStreamById(stream.id);
      });
    };
  }, []);

  useEffect(() => {
    if (constraints) {
      avStreamingInstance.updateConstraints(constraints);
    } else {
      avStreamingInstance.updateConstraints(DEFAULT_AV_STREAMING_CONSTRAINTS);
    }
  }, [constraints?.audio, constraints?.video]);

  return (
    <FaceTime
      streamConfig={myStreamConfig}
      muted
      mirrorImage={mirrorImage}
      {...props}
    />
  );
};
