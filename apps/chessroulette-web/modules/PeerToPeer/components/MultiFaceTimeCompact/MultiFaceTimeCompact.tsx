import React, { useEffect, useMemo, useState, useRef } from 'react';
import useInstance from '@use-it/instance';
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/solid';
import { Reel } from './components/Reel';
import { FaceTime, FaceTimeProps } from '../FaceTime';
import { MyFaceTime } from '../MyFaceTime';
import { ReelState } from '../../types';
import {
  AVStreaming,
  getAVStreamingInstance,
} from '../../services/AVStreaming';
import { PeerUserId } from '../../publicTypes';

type OverlayedNodeRender = (p: { inFocus?: PeerUserId }) => React.ReactNode;

export type MultiFaceTimeCompactProps = {
  onFocus: (userId: PeerUserId) => void;
  headerOverlay?: OverlayedNodeRender;
  footerOverlay?: OverlayedNodeRender;
  mainOverlay?: OverlayedNodeRender;
  reel?: ReelState;
  cameraDisable?: () => void;

  width?: number;
  containerClassName?: string;
  isExpanded?: boolean;
  cameraVisible?: boolean;
  onToggleExpand?: () => void;
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
  cameraVisible,
  cameraDisable,
  containerClassName,
  width,
  headerOverlay,
  footerOverlay,
  mainOverlay,
  isExpanded,
  onToggleExpand,
  ...faceTimeProps
}) => {
  const containerStyles = useMemo(
    () => ({ width: width || '100%', height: '100%' }),
    [width]
  );

  const label = useMemo(() => {
    if (!reel) {
      return '';
    }

    return reel.focusedStreamingPeer.userDisplayName || '';
  }, [reel]);
  const isFirstRender = useRef(true);
  const inFocusUserOverlay = useMemo(() => ({ inFocus: undefined }), [reel]);

  const avStreaminginstance = useInstance<AVStreaming>(getAVStreamingInstance);
  const [myFaceTimeConstraints, setMyFaceTimeConstraints] = useState(
    avStreaminginstance.activeConstraints
  );

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return avStreaminginstance.pubsy.subscribe(
      'onUpdateConstraints',
      setMyFaceTimeConstraints
    );
  }, [avStreaminginstance]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isExpanded && onToggleExpand) {
      onToggleExpand();
    }
    avStreaminginstance.updateConstraints({
      ...myFaceTimeConstraints,
      video: false,
    });
  }, [cameraVisible]);

  const MicIcon =
    myFaceTimeConstraints.audio === false ? SpeakerXMarkIcon : SpeakerWaveIcon;
  const CameraIcon =
    myFaceTimeConstraints.video === false
      ? VideoCameraSlashIcon
      : VideoCameraIcon;

  return (
    <div className={`relative ${containerClassName}`} style={containerStyles}>
      {reel ? (
        <FaceTime
          streamConfig={reel.focusedStreamingPeer.connection.channels.streaming}
          label={label}
          labelPosition="bottom-left"
          {...faceTimeProps}
        />
      ) : (
        <MyFaceTime
          {...faceTimeProps}
          constraints={myFaceTimeConstraints}
          label={label}
          labelPosition="bottom-left"
          onReady={() => setIsReady(true)}
        />
      )}
      <div className="absolute inset-0 flex flex-col">
        <div>{headerOverlay ? headerOverlay(inFocusUserOverlay) : null}</div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1">
            <button
              onClick={() => cameraDisable?.()}
              className={`
                                    absolute right-2 h-8 z-50 bg-black/50 text-white rounded-md p-1 hover:bg-black/70
                                    top-2
                                  `}
            >
              ✕
            </button>
            {onToggleExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="absolute top-11 right-2 z-40 bg-black/50 text-white
               rounded-md px-1 hover:bg-black/70 scale-[2]"
              >
                {isExpanded ? '⤢' : '⤡'}
              </button>
            )}
            {mainOverlay ? mainOverlay(inFocusUserOverlay) : null}

            {/* {isReady && ( */}
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
            {/* )} */}
          </div>

          {reel && (
            <div
              className="flex overflow-auto pr-1 pb-1"
              style={{
                width: '25%',
              }}
            >
              <div className="flex flex-col-reverse flex-1 overflow-y-auto hover:">
                <Reel
                  streamingPeers={reel.streamingPeers}
                  myFaceTimeConstraints={myFaceTimeConstraints}
                  onClick={onFocus}
                />
              </div>
            </div>
          )}
        </div>
        <div>{footerOverlay ? footerOverlay(inFocusUserOverlay) : null}</div>
      </div>
    </div>
  );
};
