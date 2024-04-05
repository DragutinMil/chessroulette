import React, { useEffect, useMemo, useState } from 'react';
import { FaceTime, FaceTimeProps } from '../FaceTime';
import { Reel } from './components/Reel';
import { MyFaceTime } from '../MyFaceTime';
import {
  PeerUserId,
  StreamingPeer,
} from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import {
  AVStreaming,
  AVStreamingConstraints,
  getAVStreamingInstance,
} from 'apps/chessroulette-web/services/AVStreaming';
import useInstance from '@use-it/instance';
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/solid';

type OverlayedNodeRender = (p: { inFocus?: PeerUserId }) => React.ReactNode;

export type Reel = {
  streamingPeers: StreamingPeer[];
  // TODO: Add these back
  myStreamingPeerUserId: StreamingPeer['userId'];
  focusedStreamingPeer: Pick<StreamingPeer, 'connection' | 'userId'>; // TODO: Bring back
};

export type MultiFaceTimeCompactProps = {
  reel?: Reel;

  onFocus: (userId: PeerUserId) => void;

  width?: number;
  containerClassName?: string;

  headerOverlay?: OverlayedNodeRender;
  footerOverlay?: OverlayedNodeRender;
  mainOverlay?: OverlayedNodeRender;
} & Omit<
  FaceTimeProps,
  | 'streamConfig'
  | 'footer'
  | 'header'
  | 'onFocus'
  | 'mainOverlay'
  | 'footerOverlay'
  | 'headerOverlay'
>;

export const MultiFaceTimeCompact: React.FC<MultiFaceTimeCompactProps> = ({
  reel,
  onFocus,

  containerClassName,
  width,
  headerOverlay,
  footerOverlay,
  mainOverlay,

  ...faceTimeProps
}) => {
  // const cls = useStyles();
  const containerStyles = useMemo(() => ({ width: width || '100%' }), [width]);

  const label = useMemo(() => {
    // return 'FIX LABEL';
    if (!reel) {
      return '';
    }

    return reel.focusedStreamingPeer.userId;

    // return reel.focusedStreamingPeer.userId === reel.myStreamingPeerUserId
    //   ? // ? getUserDisplayName(reel.focusedStreamingPeer.user)
    //     reel.focusedStreamingPeer.userId
    //   : '';
  }, [reel]);

  const inFocusUserOverlay = useMemo(
    // () => ({ inFocus: reel?.focusedStreamingPeer.user }),
    () => ({ inFocus: undefined }),
    [reel]
  );

  const avStreaminginstance = useInstance<AVStreaming>(getAVStreamingInstance);
  const [myFaceTimeConstraints, setMyFaceTimeConstraints] = useState(
    avStreaminginstance.activeConstraints
  );

  // console.log('myFaceTimeConstraints', myFaceTimeConstraints);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return avStreaminginstance.pubsy.subscribe(
      'onUpdateConstraints',
      setMyFaceTimeConstraints
    );
  }, [avStreaminginstance]);

  const MicIcon =
    myFaceTimeConstraints.audio === false ? SpeakerXMarkIcon : SpeakerWaveIcon;
  const CameraIcon =
    myFaceTimeConstraints.video === false
      ? VideoCameraSlashIcon
      : VideoCameraIcon;

  return (
    <div
      // className={cx(cls.container, containerClassName)}
      className={`relative ${containerClassName}`}
      style={containerStyles}
    >
      {reel ? (
        <FaceTime
          // streamConfig={reel.focusedStreamingPeer.connection.channels.streaming}
          streamConfig={reel.focusedStreamingPeer.connection.channels.streaming}
          // label={label} //TODO: This was taken out for now, as it shows the randomly generate id. Apirl 5th 2024
          labelPosition="bottom-left"
          {...faceTimeProps}
        />
      ) : (
        <MyFaceTime
          {...faceTimeProps}
          constraints={myFaceTimeConstraints}
          // label={label}
          labelPosition="bottom-left"
          onReady={() => setIsReady(true)}
        />
      )}
      <div
        // className={cls.overlayedContainer}
        className="absolute inset-0 flex flex-col"
      >
        <div
          // className={cls.headerWrapper}
          className=""
        >
          {headerOverlay ? headerOverlay(inFocusUserOverlay) : null}
        </div>
        <div className="flex flex-1 min-h-0">
          <div
            // className={cls.mainOverlayWrapper}
            className="flex-1"
          >
            {mainOverlay ? mainOverlay(inFocusUserOverlay) : null}
            {isReady && (
              <div className="flex-1 nbg-red-100 w-full h-full items-start">
                <div className="p-2 flex flex-col">
                  <MicIcon
                    className="p-1 h-8 w-8 hover:bg-white hover:cursor-pointer hover:text-black hover:rounded-xl"
                    onClick={() => {
                      avStreaminginstance.updateConstraints({
                        ...myFaceTimeConstraints,
                        audio: !myFaceTimeConstraints.audio,
                      });
                    }}
                  />
                  <CameraIcon
                    className="p-1 h-8 w-8 hover:bg-white hover:cursor-pointer hover:text-black hover:rounded-xl"
                    onClick={() => {
                      avStreaminginstance.updateConstraints({
                        ...myFaceTimeConstraints,
                        video: !myFaceTimeConstraints.video,
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {reel && (
            <div
              // className={cls.reelWrapper}
              className="flex overflow-auto pr-1 pb-1"
              style={{
                width: '25%',
              }}
            >
              <div
                // className={cls.reelScroller}
                //     minHeight: '100%',
                //     display: 'flex',
                //     flexDirection: 'column-reverse',
                //     flex: 1,
                //     overflowY: 'auto',

                //     // overscroll: auto;
                //     msOverflowStyle: '-ms-autohiding-scrollbar',

                //     '&:hover': {
                //       // overflowY: 'scroll',
                //     },
                className="flex flex-col-reverse flex-1 overflow-y-auto hover:"
              >
                <Reel streamingPeers={reel.streamingPeers} onClick={onFocus} />
              </div>
            </div>
          )}
        </div>
        <div
          // className={cls.footerWrapper}
          className=""
        >
          {footerOverlay ? footerOverlay(inFocusUserOverlay) : null}
        </div>
      </div>
    </div>
  );
};
