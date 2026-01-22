import React, { useEffect, useMemo, useState, useRef } from 'react';
import useInstance from '@use-it/instance';
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  ArrowsPointingInIcon,
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
  cameraOnAgain?: boolean;
  camera?: boolean;
  cameraDisable?: () => void;
  width?: number;
  containerClassName?: string;
  isExpanded?: boolean;
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
  cameraDisable,
  cameraOnAgain,
  containerClassName,
  width,
  headerOverlay,
  camera,
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
  const inFocusUserOverlay = useMemo(() => ({ inFocus: undefined }), [reel]);
  const [visible, setVisible] = useState(false);
  const avStreaminginstance = useInstance<AVStreaming>(getAVStreamingInstance);
  const [myFaceTimeConstraints, setMyFaceTimeConstraints] = useState<
    AVStreaming['activeConstraints'] | null
  >(null);
  const [videoPermission, setVideoPermission] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const isMobile=window.innerWidth < 1000
  useEffect(() => {
    const initial = {
      ...avStreaminginstance.activeConstraints,
      video: isMobile ? false : avStreaminginstance.activeConstraints.video,
      audio: isMobile ? false : avStreaminginstance.activeConstraints.audio,
    };
    setMyFaceTimeConstraints(initial);
    avStreaminginstance.updateConstraints(initial);
       
    return avStreaminginstance.pubsy.subscribe(
      'onUpdateConstraints',
      setMyFaceTimeConstraints
    );
  }, [avStreaminginstance]);
  //console.log('myFaceTimeConstraints',myFaceTimeConstraints)
  const onStreamConfigChange = (value: boolean) => {
    setVideoPermission(value);
  };
  useEffect(() => {
   if(cameraOnAgain){
    avStreaminginstance.updateConstraints({
      ...myFaceTimeConstraints,
      video: true,
      audio:true
    });
   }
  }, [cameraOnAgain]);
  
  const cameraDisableComponent = () => {
    if (!myFaceTimeConstraints) return;
    avStreaminginstance.updateConstraints({
      ...myFaceTimeConstraints,
      video: false,
      audio:false
    });
    cameraDisable?.();
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const MicIcon =
    myFaceTimeConstraints?.audio === false ? SpeakerXMarkIcon : SpeakerWaveIcon;
  const CameraIcon =
    myFaceTimeConstraints?.video === false
      ? VideoCameraSlashIcon
      : VideoCameraIcon;

  const ExpandIcon =
    isExpanded === false ? ArrowsPointingOutIcon : ArrowsPointingInIcon;

  return (
    <div className={`relative ${containerClassName}`} style={containerStyles}>
      {reel && myFaceTimeConstraints ? (
        <FaceTime
          streamConfig={reel.focusedStreamingPeer.connection.channels.streaming}
          label={label}
          labelPosition="bottom-left"
          {...faceTimeProps}
        />
      ) : (
        myFaceTimeConstraints && (
          <MyFaceTime
            streamConfigChange={onStreamConfigChange}
            {...faceTimeProps}
            constraints={myFaceTimeConstraints}
            label={label}
            labelPosition="bottom-left"
            onReady={() => setIsReady(true)}
          />
        )
      )}
      <div className="absolute inset-0 flex flex-col">
        <div>{headerOverlay ? headerOverlay(inFocusUserOverlay) : null}</div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1">
            {/* isReady */}
            {((camera && videoPermission) || cameraOnAgain) && (
              <XMarkIcon
                className={`
  absolute right-2 top-2 h-8 z-50
  bg-black/50 text-white rounded-md p-1
  hover:bg-green-400 hover:rounded-xl hover:bg-black/70
  transition-opacity duration-300
  ${visible ? 'opacity-100' : 'opacity-0'}
`}
                onClick={() => cameraDisableComponent()}
              />
            )}
            {onToggleExpand &&
              ((camera && videoPermission) || cameraOnAgain) && (
                <ExpandIcon
                  className={`absolute h-7 w-7 top-10 hover:bg-green-400 right-2.5 z-40 bg-black/50 text-white hover:rounded-xl
               rounded-md px-1  hover:bg-black/70 duration-300
  ${visible ? 'opacity-100' : 'opacity-0'} `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                />
              )}

            {mainOverlay ? mainOverlay(inFocusUserOverlay) : null}

            {((camera && videoPermission) || cameraOnAgain) && (
              <div
                className={`flex-1 nbg-red-100 w-full h-full items-start duration-300
  ${visible ? 'opacity-100' : 'opacity-0'} `}
              >
                <div className="p-2 flex flex-col">
                  <MicIcon
                    className="p-1 h-8 w-8  hover:bg-green-400  hover:cursor-pointer hover:text-black hover:rounded-xl"
                    onClick={() => {
                      if (!myFaceTimeConstraints) return;
                      avStreaminginstance.updateConstraints({
                        ...myFaceTimeConstraints,
                        audio: !myFaceTimeConstraints.audio,
                      });
                    }}
                  />
                  <CameraIcon
                    className="p-1 h-8 w-8 hover:bg-green-400 hover:cursor-pointer hover:text-black hover:rounded-xl"
                    onClick={() => {
                      if (!myFaceTimeConstraints) return;
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

          {reel && myFaceTimeConstraints && (
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
